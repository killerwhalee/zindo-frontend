import { useParams } from 'react-router-dom';
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from 'recharts';
import TopBar from '@/components/layout/TopBar';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { convertGrade } from '@/lib/utils';
import { listAvg } from '@/lib/stats';
import { COLORS, fmt, pct, shortDate, useBatchContext } from '@/pages/Stats/batchShared';

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
	const toPos = (v: number) => `${Math.max(0, Math.min(97, ((v - min) / range) * 100))}%`;
	const pins = [
		{ name: '최소', value: min, textCls: 'text-muted-foreground', bg: 'bg-muted-foreground/50', thick: false },
		{ name: '평균', value: avg, textCls: 'text-orange-500', bg: 'bg-orange-400', thick: false },
		{ name: '나', value: currentValue, textCls: 'text-primary', bg: 'bg-primary', thick: true },
		{ name: '최대', value: max, textCls: 'text-muted-foreground', bg: 'bg-muted-foreground/50', thick: false },
	];
	return (
		<div className="relative h-14 mt-1">
			<div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
			{pins.map((pin, i) => (
				<div key={i} className="absolute flex flex-col items-center"
					style={{ left: toPos(pin.value), transform: 'translateX(-50%)', top: 0, bottom: 0 }}>
					<span className={`text-[9px] font-semibold leading-tight ${pin.textCls} whitespace-nowrap`}>{pin.name}</span>
					<span className={`text-[9px] leading-tight ${pin.textCls} whitespace-nowrap`}>{formatter(pin.value)}</span>
					<div className="flex-1" />
					<div className={`${pin.thick ? 'w-0.5 h-4' : 'w-px h-3'} ${pin.bg}`} />
				</div>
			))}
		</div>
	);
}

function MetricCard({
	label, currentLabel, allValues, currentValue, formatter,
}: {
	label: string; currentLabel: string; allValues: number[];
	currentValue: number | null; formatter: (n: number) => string;
}) {
	const showChart = allValues.length >= 2 && currentValue !== null;
	return (
		<Card className="py-0">
			<CardHeader className={showChart ? 'pt-3 pb-0 px-5' : 'py-3 px-5'}>
				<CardDescription className="text-xs">{label}</CardDescription>
				<CardTitle className="text-2xl">{currentLabel}</CardTitle>
			</CardHeader>
			{showChart && (
				<CardContent className="px-5 pb-3 pt-0">
					<PinChart allValues={allValues} currentValue={currentValue} formatter={formatter} />
				</CardContent>
			)}
		</Card>
	);
}

export default function StatsBatchStudent() {
	const { studentId } = useParams<{ studentId: string }>();
	const { students, metricsResults, crossValues } = useBatchContext();

	const idx = students.findIndex((s) => String(s.id) === studentId);
	const student = idx >= 0 ? students[idx] : null;
	const result = idx >= 0 ? metricsResults[idx] : null;

	if (!student || !result) {
		return (
			<div className="pt-16 pb-8">
				<TopBar title="학습 통계" />
				<p className="p-8 text-center text-muted-foreground">학생을 찾을 수 없습니다.</p>
			</div>
		);
	}

	const finishedSheets = result.sheetMetrics.filter((sm) => sm.sheet.is_finished && sm.daysElapsed > 0);
	const avgDays = listAvg(finishedSheets.map((sm) => sm.daysElapsed));
	const avgAP = listAvg(finishedSheets.filter((sm) => sm.ap !== null).map((sm) => sm.ap as number));
	const avgDR = listAvg(finishedSheets.map((sm) => sm.dr));
	const m = result.studentMetrics;

	return (
		<div className="pt-16 pb-8">
			<TopBar title={`${student.name} 학습 통계`} />

			<div className="p-4 space-y-4">
				<h3 className="text-xl font-semibold tracking-tight">
					{student.name} <span className="text-base font-normal text-muted-foreground">({convertGrade(student.grade)})</span>
				</h3>

				{/* Basic stats */}
				<div className="grid grid-cols-2 gap-3">
					<Card className="py-0">
						<CardHeader className="py-3 px-5">
							<CardDescription className="text-xs">전체 페이지</CardDescription>
							<CardTitle className="text-2xl">{m.totalPages.toLocaleString()}p</CardTitle>
						</CardHeader>
					</Card>
					<Card className="py-0">
						<CardHeader className="py-3 px-5">
							<CardDescription className="text-xs">완료 교재</CardDescription>
							<CardTitle className="text-2xl">{m.totalFinished}권</CardTitle>
						</CardHeader>
					</Card>
				</div>

				{/* Subject pie */}
				{m.subjectComposition.length > 0 && (
					<Card className="py-0">
						<CardHeader className="py-3 px-5">
							<CardDescription className="text-xs">과목별 교재 비율</CardDescription>
						</CardHeader>
						<CardContent className="px-5 pb-3 pt-0">
							<ResponsiveContainer width="100%" height={200}>
								<PieChart>
									<Pie data={m.subjectComposition} dataKey="pages" nameKey="subject" cx="50%" cy="50%" outerRadius={70}>
										{m.subjectComposition.map((_, i) => (
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

				{/* Efficiency metrics */}
				<div className="space-y-3">
					<MetricCard label="일일 평균 페이지 (PPD)" currentLabel={`${fmt(m.ppd)}p/일`}
						allValues={crossValues?.ppd ?? []} currentValue={m.ppd}
						formatter={(v) => `${v.toFixed(1)}p`} />
					<MetricCard label="교재당 소모일 (DPB)" currentLabel={m.dpb > 0 ? `${fmt(m.dpb)}일` : '-'}
						allValues={crossValues?.dpb ?? []} currentValue={m.dpb > 0 ? m.dpb : null}
						formatter={(v) => `${Math.round(v)}일`} />
					<MetricCard label="평균 페이스 (AP)" currentLabel={pct(m.ap)}
						allValues={crossValues?.ap ?? []} currentValue={m.ap}
						formatter={(v) => `${(v * 100).toFixed(0)}%`} />
					<MetricCard label="밀림율 (DR)" currentLabel={pct(m.dr)}
						allValues={crossValues?.dr ?? []} currentValue={m.dr}
						formatter={(v) => `${(v * 100).toFixed(0)}%`} />
				</div>

				{/* Finished sheets table */}
				{finishedSheets.length > 0 && (
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
				)}
			</div>
		</div>
	);
}
