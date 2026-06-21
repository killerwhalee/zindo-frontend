import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from 'recharts';
import api from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { convertGrade } from '@/lib/utils';
import type { Record as LearningRecord, Student } from '@/components/types';
import {
	computeSheetMetrics,
	computeStudentMetrics,
	getValidDays,
	listAvg,
	type SheetMetrics,
	type StudentMetrics,
} from '@/lib/stats';
import StatsReport from '@/pages/Stats/StatsReport';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

function fmt(n: number, decimals = 1): string {
	return n.toFixed(decimals);
}

function pct(n: number | null): string {
	if (n === null) return '-';
	return `${(n * 100).toFixed(1)}%`;
}

function shortDate(s: string): string {
	if (!s) return '-';
	// YYYY-MM-DD → MM/DD
	return s.slice(5).replace('-', '/');
}

// Horizontal pin chart: min | avg | 나 | max positioned on a track line
function PinChart({
	allValues,
	currentValue,
	formatter,
}: {
	allValues: number[];
	currentValue: number | null;
	formatter: (n: number) => string;
}) {
	if (allValues.length < 2 || currentValue === null) return null;

	const min = Math.min(...allValues);
	const max = Math.max(...allValues);
	const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
	const range = max - min || 1;
	const toPos = (v: number) =>
		`${Math.max(0, Math.min(97, ((v - min) / range) * 100))}%`;

	const pins = [
		{ name: '최소', value: min, textCls: 'text-muted-foreground', bg: 'bg-muted-foreground/50', z: 1, thick: false },
		{ name: '평균', value: avg, textCls: 'text-orange-500', bg: 'bg-orange-400', z: 2, thick: false },
		{ name: '나', value: currentValue, textCls: 'text-primary', bg: 'bg-primary', z: 3, thick: true },
		{ name: '최대', value: max, textCls: 'text-muted-foreground', bg: 'bg-muted-foreground/50', z: 1, thick: false },
	];

	return (
		<div className="relative h-14 mt-1">
			<div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
			{pins.map((pin, i) => (
				<div
					key={i}
					className="absolute flex flex-col items-center"
					style={{
						left: toPos(pin.value),
						transform: 'translateX(-50%)',
						top: 0,
						bottom: 0,
						zIndex: pin.z,
					}}
				>
					<span className={`text-[9px] font-semibold leading-tight ${pin.textCls} whitespace-nowrap`}>
						{pin.name}
					</span>
					<span className={`text-[9px] leading-tight ${pin.textCls} whitespace-nowrap`}>
						{formatter(pin.value)}
					</span>
					<div className="flex-1" />
					<div className={`${pin.thick ? 'w-0.5 h-4' : 'w-px h-3'} ${pin.bg}`} />
				</div>
			))}
		</div>
	);
}

function MetricCard({
	label,
	currentLabel,
	allValues,
	currentValue,
	formatter,
}: {
	label: string;
	currentLabel: string;
	allValues: number[];
	currentValue: number | null;
	formatter: (n: number) => string;
}) {
	const showChart = allValues.length >= 2 && currentValue !== null;
	return (
		<Card className='py-0'>
			<CardHeader className={showChart ? 'pt-3 pb-0 px-5' : 'py-3 px-5'}>
				<CardDescription className="text-xs">{label}</CardDescription>
				<CardTitle className="text-2xl">{currentLabel}</CardTitle>
			</CardHeader>
			{showChart && (
				<CardContent className="px-5 pb-3 pt-0">
					<PinChart
						allValues={allValues}
						currentValue={currentValue}
						formatter={formatter}
					/>
				</CardContent>
			)}
		</Card>
	);
}

interface CrossStudentValues {
	ppd: number[];
	dpb: number[];
	ap: number[];
	dr: number[];
}

export default function StatsDetail() {
	const { studentId } = useParams<{ studentId: string }>();

	const [student, setStudent] = useState<Student | null>(null);
	const [studentLoading, setStudentLoading] = useState(true);

	const today = new Date();
	const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
	const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'));

	const [sheetMetrics, setSheetMetrics] = useState<SheetMetrics[]>([]);
	const [studentMetrics, setStudentMetrics] = useState<StudentMetrics | null>(null);
	const [crossValues, setCrossValues] = useState<CrossStudentValues | null>(null);
	const [validDays, setValidDays] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(false);
	const [hasFetched, setHasFetched] = useState(false);
	const [pdfLoading, setPdfLoading] = useState(false);

	const reportRef = useRef<HTMLDivElement>(null);
	const pieCanvasRef = useRef<HTMLCanvasElement>(null);
	const [pieChartUrl, setPieChartUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!studentId) return;
		api
			.get(`/zindo/students/${studentId}/`)
			.then((res) => setStudent(res.data))
			.catch((err) => console.error(err))
			.finally(() => setStudentLoading(false));
	}, [studentId]);

	useEffect(() => {
		const canvas = pieCanvasRef.current;
		if (!canvas || !studentMetrics?.subjectComposition.length) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const { subjectComposition } = studentMetrics;
		const total = subjectComposition.reduce((s, e) => s + e.pages, 0);
		const cx = canvas.width / 2;
		const cy = canvas.height / 2;
		const r = Math.min(cx, cy) * 0.85;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		let angle = -Math.PI / 2;
		subjectComposition.forEach((entry, i) => {
			const sweep = (entry.pages / total) * 2 * Math.PI;
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.arc(cx, cy, r, angle, angle + sweep);
			ctx.closePath();
			ctx.fillStyle = COLORS[i % COLORS.length];
			ctx.fill();
			angle += sweep;
		});

		setPieChartUrl(canvas.toDataURL('image/png'));
	}, [studentMetrics]);

	const fetchMetrics = async () => {
		if (!studentId) return;
		setLoading(true);
		try {
			// Fetch without date filter so finished sheets retain their full record range.
			// Date filtering is applied in JS.
			const [allRes, studentRes] = await Promise.all([
				api.get('/zindo/records/'),
				api.get('/zindo/records/', { params: { sheet__student__id: studentId } }),
			]);

			const allRecords: LearningRecord[] = allRes.data;
			const studentRecordsAll: LearningRecord[] = studentRes.data;

			const globalValidDays = getValidDays(allRecords);
			const inRange = (d: string) =>
				(!startDate || d >= startDate) && (!endDate || d <= endDate);
			const selectedValidDays = startDate || endDate
				? new Set([...globalValidDays].filter(inRange))
				: globalValidDays;
			setValidDays(selectedValidDays);

			// Sheets with at least one record in the selected date range
			const inRangeSheetIds = new Set(
				studentRecordsAll
					.filter(r => inRange(r.created_at.slice(0, 10)))
					.map(r => r.sheet_detail.id),
			);

			// Group all student records by sheet
			const bySheet = new Map<number, LearningRecord[]>();
			for (const r of studentRecordsAll) {
				const sid = r.sheet_detail.id;
				if (!bySheet.has(sid)) bySheet.set(sid, []);
				bySheet.get(sid)!.push(r);
			}

			const metricsList: SheetMetrics[] = [];
			for (const [sheetId, records] of bySheet) {
				if (!inRangeSheetIds.has(sheetId)) continue;
				const sheet = records[0].sheet_detail;

				if (sheet.is_finished) {
					// Use all records. validDays scoped to the sheet's own active period
					// so DR and daysElapsed reflect the book from start to finish.
					const dates = records.map(r => r.created_at.slice(0, 10)).sort();
					const sheetValidDays = new Set(
						[...globalValidDays].filter(d => d >= dates[0] && d <= dates[dates.length - 1]),
					);
					metricsList.push(computeSheetMetrics(records, sheet, sheetValidDays));
				} else {
					// Use only in-range records + selected-period valid days
					const rangeRecords = records.filter(r => inRange(r.created_at.slice(0, 10)));
					if (rangeRecords.length > 0) {
						metricsList.push(computeSheetMetrics(rangeRecords, sheet, selectedValidDays));
					}
				}
			}
			metricsList.sort((a, b) => b.pages - a.pages);
			setSheetMetrics(metricsList);
			setStudentMetrics(computeStudentMetrics(metricsList));

			// Cross-student: same logic as per-student — finished sheets use full range
			const byStudentId = new Map<number, LearningRecord[]>();
			for (const r of allRecords) {
				const stid = r.sheet_detail.student_detail.id;
				if (!byStudentId.has(stid)) byStudentId.set(stid, []);
				byStudentId.get(stid)!.push(r);
			}
			const allStudentMetrics: StudentMetrics[] = [];
			for (const [, sRecs] of byStudentId) {
				const bySheetId = new Map<number, LearningRecord[]>();
				for (const r of sRecs) {
					const sid = r.sheet_detail.id;
					if (!bySheetId.has(sid)) bySheetId.set(sid, []);
					bySheetId.get(sid)!.push(r);
				}
				const smList: SheetMetrics[] = [];
				for (const [, recs] of bySheetId) {
					const hasInRange = recs.some(r => inRange(r.created_at.slice(0, 10)));
					if (!hasInRange) continue;
					const sheet = recs[0].sheet_detail;
					if (sheet.is_finished) {
						const dates = recs.map(r => r.created_at.slice(0, 10)).sort();
						const sheetVD = new Set(
							[...globalValidDays].filter(d => d >= dates[0] && d <= dates[dates.length - 1]),
						);
						smList.push(computeSheetMetrics(recs, sheet, sheetVD));
					} else {
						const rangeRecs = recs.filter(r => inRange(r.created_at.slice(0, 10)));
						if (rangeRecs.length > 0) {
							smList.push(computeSheetMetrics(rangeRecs, sheet, selectedValidDays));
						}
					}
				}
				if (smList.length > 0) {
					allStudentMetrics.push(computeStudentMetrics(smList));
				}
			}
			setCrossValues({
				ppd: allStudentMetrics.map(m => m.ppd),
				dpb: allStudentMetrics.filter(m => m.dpb > 0).map(m => m.dpb),
				ap: allStudentMetrics.filter(m => m.ap !== null).map(m => m.ap as number),
				dr: allStudentMetrics.map(m => m.dr),
			});

			setHasFetched(true);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const applyPreset = (preset: 'month' | 'quarter' | 'year' | 'all') => {
		if (preset === 'all') {
			setStartDate('');
			setEndDate('');
			return;
		}
		const from =
			preset === 'month' ? startOfMonth(today)
				: preset === 'quarter' ? startOfQuarter(today)
					: startOfYear(today);
		setStartDate(format(from, 'yyyy-MM-dd'));
		setEndDate(format(today, 'yyyy-MM-dd'));
	};

	const handleExportPdf = async () => {
		if (!reportRef.current || !student) return;
		setPdfLoading(true);
		const htmlContent = reportRef.current.outerHTML;
		try {
			const { default: html2pdf } = await import('html2pdf.js');
			await html2pdf()
				.set({
					margin: 10,
					filename: `${student.name}_학습통계.pdf`,
					image: { type: 'jpeg', quality: 0.95 },
					html2canvas: {
						scale: 2,
						useCORS: true,
						imageTimeout: 15000,
						onclone: (clonedDoc: Document) => {
							const fix = clonedDoc.createElement('style');
							fix.textContent = `
								:root, html, body {
									--background: #ffffff !important; --foreground: #09090b !important;
									--card: #ffffff !important; --card-foreground: #09090b !important;
									--muted: #f4f4f5 !important; --muted-foreground: #71717a !important;
									--border: #e4e4e7 !important; --primary: #18181b !important;
									--primary-foreground: #fafafa !important;
									background-color: #ffffff !important; color: #09090b !important;
								}
							`;
							clonedDoc.head.appendChild(fix);
						},
					},
					jsPDF: { unit: 'mm', format: 'a4' },
				})
				.from(htmlContent)
				.save();
		} catch (e) {
			console.error('PDF export failed:', e);
		} finally {
			setPdfLoading(false);
		}
	};

	const finishedSheets = sheetMetrics.filter(sm => sm.sheet.is_finished && sm.daysElapsed > 0);
	const finishedAP = finishedSheets.filter(sm => sm.ap !== null).map(sm => sm.ap as number);

	const avgDays = listAvg(finishedSheets.map(sm => sm.daysElapsed));
	const avgAP = listAvg(finishedAP);
	const avgDR = listAvg(finishedSheets.map(sm => sm.dr));

	return (
		<div className="pt-16 pb-8">
			<TopBar title="학습 통계" />

			<canvas ref={pieCanvasRef} width={200} height={200} className="hidden" />

			<div className="p-4 space-y-5">
				{studentLoading ? (
					<Skeleton className="h-8 w-40" />
				) : student ? (
					<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
						{student.name} ({convertGrade(student.grade)})
					</h3>
				) : null}

				<div className="space-y-2">
					<div className="flex gap-2 flex-wrap">
						<Button size="sm" variant="outline" onClick={() => applyPreset('month')}>이번 달</Button>
						<Button size="sm" variant="outline" onClick={() => applyPreset('quarter')}>이번 분기</Button>
						<Button size="sm" variant="outline" onClick={() => applyPreset('year')}>올해</Button>
						<Button size="sm" variant="outline" onClick={() => applyPreset('all')}>전체</Button>
					</div>
					<div className="flex gap-2 items-center">
						<Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 min-w-0" />
						<span className="text-muted-foreground shrink-0">~</span>
						<Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 min-w-0" />
						<Button size="sm" onClick={fetchMetrics} disabled={loading} className="shrink-0">
							{loading ? '...' : '조회'}
						</Button>
					</div>
				</div>

				{loading && (
					<div className="space-y-4">
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-48 w-full" />
						<Skeleton className="h-64 w-full" />
					</div>
				)}

				{!loading && hasFetched && studentMetrics && (
					<>
						{sheetMetrics.length === 0 ? (
							<div className="text-center text-muted-foreground py-8">
								선택한 기간에 기록이 없습니다.
							</div>
						) : (
							<>
								<div>
									<h3 className="text-lg font-semibold mb-3">기본 통계</h3>
									<div className="grid grid-cols-2 gap-3 mb-4">
										<Card className='py-0'>
											<CardHeader className="py-3 px-5">
												<CardDescription className="text-xs">전체 페이지</CardDescription>
												<CardTitle className="text-2xl">{studentMetrics.totalPages.toLocaleString()}p</CardTitle>
											</CardHeader>
										</Card>
										<Card className='py-0'>
											<CardHeader className="py-3 px-5">
												<CardDescription className="text-xs">완료 교재</CardDescription>
												<CardTitle className="text-2xl">{studentMetrics.totalFinished}권</CardTitle>
											</CardHeader>
										</Card>
									</div>

									{studentMetrics.subjectComposition.length > 0 && (
										<Card className='py-0'>
											<CardHeader className="py-3 px-5">
												<CardDescription className="text-xs">과목별 교재 비율</CardDescription>
											</CardHeader>
											<CardContent className="px-5 pb-3 pt-0">
												<ResponsiveContainer width="100%" height={200}>
													<PieChart>
														<Pie data={studentMetrics.subjectComposition} dataKey="pages" nameKey="subject" cx="50%" cy="50%" outerRadius={70}>
															{studentMetrics.subjectComposition.map((_, i) => (
																<Cell key={i} fill={COLORS[i % COLORS.length]} />
															))}
														</Pie>
														<Tooltip formatter={(v) => `${v}p`} />
														<Legend />
													</PieChart>
												</ResponsiveContainer>
											</CardContent>
										</Card>
									)}
								</div>

								<div>
									<h3 className="text-lg font-semibold mb-3">학습 효율 지표</h3>
									<div className="space-y-3">
										<MetricCard
											label="평균 페이지 (PPD)"
											currentLabel={`${fmt(studentMetrics.ppd)}p/일`}
											allValues={crossValues?.ppd ?? []}
											currentValue={studentMetrics.ppd}
											formatter={(v) => `${v.toFixed(1)}p`}
										/>
										<MetricCard
											label="교재당 소모일 (DPB)"
											currentLabel={studentMetrics.dpb > 0 ? `${fmt(studentMetrics.dpb)}일` : '-'}
											allValues={crossValues?.dpb ?? []}
											currentValue={studentMetrics.dpb > 0 ? studentMetrics.dpb : null}
											formatter={(v) => `${Math.round(v)}일`}
										/>
										<MetricCard
											label="평균 페이스 (AP)"
											currentLabel={pct(studentMetrics.ap)}
											allValues={crossValues?.ap ?? []}
											currentValue={studentMetrics.ap}
											formatter={(v) => `${(v * 100).toFixed(0)}%`}
										/>
										<MetricCard
											label="밀림율 (DR)"
											currentLabel={pct(studentMetrics.dr)}
											allValues={crossValues?.dr ?? []}
											currentValue={studentMetrics.dr}
											formatter={(v) => `${(v * 100).toFixed(0)}%`}
										/>
									</div>
								</div>

								{finishedSheets.length > 0 && (
									<div>
										<h3 className="text-lg font-semibold mb-3">교재별 상세</h3>
										<div className="rounded-md border overflow-x-auto">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>교재</TableHead>
														<TableHead className="text-right">소요일</TableHead>
														<TableHead className="text-right">AP</TableHead>
														<TableHead className="text-right">DR</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{finishedSheets.map((sm) => (
														<TableRow key={sm.sheet.id}>
															<TableCell>
																<div className="flex items-center gap-2">
																	{sm.sheet.textbook_detail.image ? (
																		<img src={sm.sheet.textbook_detail.image} alt="" className="w-8 h-10 object-cover rounded shrink-0" />
																	) : (
																		<div className="w-8 h-10 rounded shrink-0 bg-muted flex items-center justify-center text-muted-foreground text-[10px]">책</div>
																	)}
																	<div className="min-w-0">
																		<p className="text-sm font-medium truncate max-w-[120px]">{sm.sheet.textbook_detail.name}</p>
																		<p className="text-xs text-muted-foreground">{sm.sheet.textbook_detail.subject} · {shortDate(sm.firstDate)} ~ {shortDate(sm.lastDate)}</p>
																	</div>
																</div>
															</TableCell>
															<TableCell className="text-right">{sm.daysElapsed}일</TableCell>
															<TableCell className="text-right">{pct(sm.ap)}</TableCell>
															<TableCell className="text-right">{pct(sm.dr)}</TableCell>
														</TableRow>
													))}
												</TableBody>
												{finishedSheets.length > 1 && (
													<tfoot>
														<TableRow className="border-t-2 font-medium text-muted-foreground">
															<TableCell>평균</TableCell>
															<TableCell className="text-right">{avgDays !== null ? `${fmt(avgDays, 0)}일` : '-'}</TableCell>
															<TableCell className="text-right">{pct(avgAP)}</TableCell>
															<TableCell className="text-right">{pct(avgDR)}</TableCell>
														</TableRow>
													</tfoot>
												)}
											</Table>
										</div>
									</div>
								)}

								<Button className="w-full" onClick={handleExportPdf} disabled={pdfLoading}>
									{pdfLoading ? '저장 중...' : 'PDF 내보내기'}
								</Button>
							</>
						)}
					</>
				)}
			</div>

			{hasFetched && studentMetrics && student && (
				<div style={{ position: 'fixed', top: 0, left: '-9999px', width: '710px', pointerEvents: 'none' }}>
					<StatsReport
						ref={reportRef}
						student={student}
						startDate={startDate}
						endDate={endDate}
						studentMetrics={studentMetrics}
						sheetMetrics={finishedSheets}
						validDays={validDays}
						pieChartUrl={pieChartUrl}
						crossValues={crossValues}
					/>
				</div>
			)}
		</div>
	);
}
