import type { Record as LearningRecord, Sheet } from '@/components/types'

function toDateStr(dt: string): string {
	return dt.slice(0, 10)
}

export function getValidDays(allRecords: LearningRecord[]): Set<string> {
	const days = new Set<string>()
	for (const r of allRecords) days.add(toDateStr(r.created_at))
	return days
}

function countValidDaysInRange(validDays: Set<string>, from: string, to: string): number {
	let n = 0
	for (const d of validDays) if (d >= from && d <= to) n++
	return n
}

export interface SheetMetrics {
	sheet: Sheet
	pages: number
	recordedDays: number  // valid days this sheet has a record
	daysElapsed: number   // valid days from first to last record (finished sheets only)
	validDaysCount: number // total valid days used as DR denominator (sheet-scoped for finished)
	ppd: number           // pages / recordedDays
	ap: number | null     // pages / (pace × daysElapsed), finished sheets only
	dr: number            // recordedDays / validDaysCount
	firstDate: string     // earliest record date (YYYY-MM-DD)
	lastDate: string      // latest record date (YYYY-MM-DD)
}

export function computeSheetMetrics(
	sheetRecords: LearningRecord[],
	sheet: Sheet,
	validDays: Set<string>,
): SheetMetrics {
	const pages = sheetRecords.reduce(
		(s, r) => s + Math.max(0, r.progress.end - r.progress.start),
		0,
	)

	const recordedDaySet = new Set<string>()
	for (const r of sheetRecords) {
		const d = toDateStr(r.created_at)
		if (validDays.has(d)) recordedDaySet.add(d)
	}
	const recordedDays = recordedDaySet.size

	let daysElapsed = 0
	let ap: number | null = null

	if (sheet.is_finished && sheetRecords.length > 0) {
		const dates = sheetRecords.map(r => toDateStr(r.created_at)).sort()
		daysElapsed = countValidDaysInRange(validDays, dates[0], dates[dates.length - 1])
		if (daysElapsed > 0) {
			const pace = sheet.pace ?? 4
			ap = pages / (pace * daysElapsed)
		}
	}

	const allDates = sheetRecords.map(r => toDateStr(r.created_at)).sort()

	return {
		sheet,
		pages,
		recordedDays,
		daysElapsed,
		validDaysCount: validDays.size,
		ppd: recordedDays > 0 ? pages / recordedDays : 0,
		ap,
		dr: validDays.size > 0 ? 1 - recordedDays / validDays.size : 0,
		firstDate: allDates[0] ?? '',
		lastDate: allDates[allDates.length - 1] ?? '',
	}
}

export interface SubjectEntry {
	subject: string
	pages: number
}

export interface StudentMetrics {
	totalPages: number
	totalFinished: number
	subjectComposition: SubjectEntry[]
	ppd: number
	dpb: number
	ap: number | null
	dr: number
}

export function computeStudentMetrics(
	sheetMetricsList: SheetMetrics[],
	validDaysTotal?: number,
): StudentMetrics {
	const totalPages = sheetMetricsList.reduce((s, sm) => s + sm.pages, 0)
	const finished = sheetMetricsList.filter(sm => sm.sheet.is_finished && sm.daysElapsed > 0)

	const subjectMap: { [s: string]: number } = {}
	for (const sm of sheetMetricsList) {
		const subj = sm.sheet.textbook_detail.subject || '기타'
		subjectMap[subj] = (subjectMap[subj] ?? 0) + sm.pages
	}
	const subjectComposition = Object.entries(subjectMap)
		.map(([subject, pages]) => ({ subject, pages }))
		.sort((a, b) => b.pages - a.pages)

	// PPD: total pages / total valid days in period (not per-sheet sum, which double-counts)
	const totalRecordedDays = sheetMetricsList.reduce((s, sm) => s + sm.recordedDays, 0)
	const ppdDenominator = validDaysTotal !== undefined ? validDaysTotal : totalRecordedDays
	const ppd = ppdDenominator > 0 ? totalPages / ppdDenominator : 0

	// DPB: Σ(daysElapsed) / n finished sheets
	const totalElapsed = finished.reduce((s, sm) => s + sm.daysElapsed, 0)
	const dpb = finished.length > 0 ? totalElapsed / finished.length : 0

	// AP: simple mean of per-sheet AP values over finished sheets — matches table footer
	const finishedAP = finished.filter(sm => sm.ap !== null).map(sm => sm.ap as number)
	const ap = finishedAP.length > 0
		? finishedAP.reduce((a, b) => a + b, 0) / finishedAP.length
		: null

	// DR: simple mean of per-sheet DR values over finished sheets — matches table footer
	// (uses finished only, same scope as the per-sheet table average row)
	const dr = finished.length > 0
		? finished.reduce((s, sm) => s + sm.dr, 0) / finished.length
		: 0

	return {
		totalPages,
		totalFinished: finished.length,
		subjectComposition,
		ppd,
		dpb,
		ap,
		dr,
	}
}


export function listAvg(values: number[]): number | null {
	if (values.length === 0) return null
	return values.reduce((a, b) => a + b, 0) / values.length
}

export function listMax(values: number[]): number | null {
	if (values.length === 0) return null
	return Math.max(...values)
}

/**
 * Encapsulates the per-student metrics computation shared between StatsDetail
 * and StatsBatchDetail. Handles finished-sheet vs active-sheet scoping.
 */
export function computeStudentMetricsFromRecords(
	studentRecords: LearningRecord[],
	globalValidDays: Set<string>,
	startDate: string,
	endDate: string,
): { sheetMetrics: SheetMetrics[]; studentMetrics: StudentMetrics } {
	const inRange = (d: string) =>
		(!startDate || d >= startDate) && (!endDate || d <= endDate)

	const selectedValidDays =
		startDate || endDate
			? new Set([...globalValidDays].filter(inRange))
			: globalValidDays

	const inRangeSheetIds = new Set(
		studentRecords
			.filter(r => inRange(r.created_at.slice(0, 10)))
			.map(r => r.sheet_detail.id),
	)

	const bySheet = new Map<number, LearningRecord[]>()
	for (const r of studentRecords) {
		const sid = r.sheet_detail.id
		if (!bySheet.has(sid)) bySheet.set(sid, [])
		bySheet.get(sid)!.push(r)
	}

	const sheetMetrics: SheetMetrics[] = []
	for (const [sheetId, records] of bySheet) {
		if (!inRangeSheetIds.has(sheetId)) continue
		const sheet = records[0].sheet_detail

		if (sheet.is_finished) {
			const dates = records.map(r => r.created_at.slice(0, 10)).sort()
			const sheetValidDays = new Set(
				[...globalValidDays].filter(d => d >= dates[0] && d <= dates[dates.length - 1]),
			)
			sheetMetrics.push(computeSheetMetrics(records, sheet, sheetValidDays))
		} else {
			const rangeRecords = records.filter(r => inRange(r.created_at.slice(0, 10)))
			if (rangeRecords.length > 0) {
				sheetMetrics.push(computeSheetMetrics(rangeRecords, sheet, selectedValidDays))
			}
		}
	}
	sheetMetrics.sort((a, b) => b.pages - a.pages)

	return { sheetMetrics, studentMetrics: computeStudentMetrics(sheetMetrics, selectedValidDays.size) }
}

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

export function renderPieChartUrl(subjectComposition: SubjectEntry[]): string {
	const canvas = document.createElement('canvas')
	canvas.width = 200
	canvas.height = 200
	const ctx = canvas.getContext('2d')
	if (!ctx || subjectComposition.length === 0) return ''

	const total = subjectComposition.reduce((s, e) => s + e.pages, 0)
	const cx = 100, cy = 100, r = 85
	let angle = -Math.PI / 2

	subjectComposition.forEach((entry, i) => {
		const sweep = (entry.pages / total) * 2 * Math.PI
		ctx.beginPath()
		ctx.moveTo(cx, cy)
		ctx.arc(cx, cy, r, angle, angle + sweep)
		ctx.closePath()
		ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length]
		ctx.fill()
		angle += sweep
	})

	return canvas.toDataURL('image/png')
}
