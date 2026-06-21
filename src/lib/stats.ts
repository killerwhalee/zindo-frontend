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

	// PPD: total pages / Σ(recordedDays per sheet)
	const totalRecordedDays = sheetMetricsList.reduce((s, sm) => s + sm.recordedDays, 0)
	const ppd = totalRecordedDays > 0 ? totalPages / totalRecordedDays : 0

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
