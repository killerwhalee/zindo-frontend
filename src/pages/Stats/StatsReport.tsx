import { forwardRef } from 'react';
import { convertGrade } from '@/lib/utils';
import type { Student } from '@/components/types';
import type { SheetMetrics, StudentMetrics } from '@/lib/stats';

// No Recharts — html2canvas cannot parse oklch() from SVG.
// Pie chart is a pre-rendered PNG data URL. All other charts use inline HTML/CSS.

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

function fmt(n: number, decimals = 1) { return n.toFixed(decimals); }
function pct(n: number | null) { return n === null ? '-' : `${(n * 100).toFixed(1)}%`; }
function formatDate(s: string) {
	if (!s) return null;
	const [y, m, d] = s.split('-');
	return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
}
function shortDate(s: string) {
	if (!s) return '-';
	return s.slice(5).replace('-', '/');
}

// Horizontal pin chart (inline styles only — safe for html2canvas)
function PinLine({
	allValues,
	currentValue,
	formatter,
}: {
	allValues: number[];
	currentValue: number | null;
	formatter: (v: number) => string;
}) {
	if (allValues.length < 2 || currentValue === null) return null;

	const min = Math.min(...allValues);
	const max = Math.max(...allValues);
	const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
	const range = max - min || 1;
	const pos = (v: number) => `${Math.max(0, Math.min(96, ((v - min) / range) * 100))}%`;

	const pins: Array<{ name: string; value: number; color: string; z: number; w: number; h: number }> = [
		{ name: '최소', value: min,          color: '#9ca3af', z: 1, w: 1, h: 10 },
		{ name: '평균', value: avg,          color: '#f97316', z: 2, w: 1, h: 12 },
		{ name: '나',   value: currentValue, color: '#3b82f6', z: 3, w: 2, h: 14 },
		{ name: '최대', value: max,          color: '#9ca3af', z: 1, w: 1, h: 10 },
	];

	return (
		<div style={{ position: 'relative', height: 48, marginTop: 6 }}>
			<div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: '#d1d5db' }} />
			{pins.map((pin, i) => (
				<div key={i} style={{
					position: 'absolute',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					left: pos(pin.value),
					transform: 'translateX(-50%)',
					top: 0,
					bottom: 0,
					zIndex: pin.z,
				}}>
					<span style={{ fontSize: 8, fontWeight: pin.w > 1 ? 700 : 500, color: pin.color, whiteSpace: 'nowrap', lineHeight: 1.3 }}>
						{pin.name}
					</span>
					<span style={{ fontSize: 8, color: pin.color, whiteSpace: 'nowrap', lineHeight: 1.2 }}>
						{formatter(pin.value)}
					</span>
					<div style={{ flex: 1 }} />
					<div style={{ width: pin.w, height: pin.h, background: pin.color }} />
				</div>
			))}
		</div>
	);
}

export interface CrossStudentValues {
	ppd: number[];
	dpb: number[];
	ap: number[];
	dr: number[];
}

interface Props {
	student: Student;
	startDate: string;
	endDate: string;
	studentMetrics: StudentMetrics;
	sheetMetrics: SheetMetrics[];  // finished sheets only
	validDays: Set<string>;
	pieChartUrl?: string | null;
	crossValues?: CrossStudentValues | null;
}

const cell: React.CSSProperties = {
	border: '1px solid #e5e7eb',
	padding: '5px 8px',
	fontSize: 11,
	textAlign: 'left',
};

const StatsReport = forwardRef<HTMLDivElement, Props>(
	({ student, startDate, endDate, studentMetrics, sheetMetrics, pieChartUrl, crossValues }, ref) => {
		const pieTotal = studentMetrics.subjectComposition.reduce((s, e) => s + e.pages, 0);

		// Column widths (content = 1040 - 48px padding = 992px)
		const COL1 = 155; // basic stats
		const COL2 = 220; // pie + legend
		const GAP  = 16;
		const COL3 = 992 - COL1 - COL2 - GAP * 2; // metrics (~585px)
		const METRIC_CARD_W = (COL3 - 8) / 2;

		const dateLabel = (() => {
			const s = formatDate(startDate);
			const e = formatDate(endDate);
			if (!s && !e) return '전체';
			if (!s) return `~ ${e}`;
			if (!e) return `${s} ~`;
			return `${s} ~ ${e}`;
		})();

		const metricCard = (
			label: string,
			value: string,
			allValues: number[],
			currentValue: number | null,
			formatter: (v: number) => string,
		) => (
			<div style={{ width: METRIC_CARD_W, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 10px', boxSizing: 'border-box' }}>
				<p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>{label}</p>
				<p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: '#111827' }}>{value}</p>
				<PinLine allValues={allValues} currentValue={currentValue} formatter={formatter} />
			</div>
		);

		const sheetAvgDays = sheetMetrics.length > 0
			? sheetMetrics.reduce((s, sm) => s + sm.daysElapsed, 0) / sheetMetrics.length
			: null;
		const sheetAvgAP = (() => {
			const vals = sheetMetrics.filter(sm => sm.ap !== null).map(sm => sm.ap as number);
			return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
		})();
		const sheetAvgDR = sheetMetrics.length > 0
			? sheetMetrics.reduce((s, sm) => s + sm.dr, 0) / sheetMetrics.length
			: null;

		return (
			<div
				ref={ref}
				style={{
					width: 1040,
					fontFamily: 'sans-serif',
					color: '#111827',
					backgroundColor: '#ffffff',
					padding: 24,
					boxSizing: 'border-box',
				}}
			>
				{/* Header */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #111827', paddingBottom: 10, marginBottom: 16 }}>
					<h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{student.name} 학습 통계 보고서</h1>
					<p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
						{convertGrade(student.grade)} &nbsp;|&nbsp; {dateLabel}
					</p>
				</div>

				{/* 3-column content row */}
				<div style={{ display: 'flex', gap: GAP, marginBottom: 16, alignItems: 'flex-start' }}>

					{/* Column 1: basic stats */}
					<div style={{ width: COL1, flexShrink: 0 }}>
						<p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, color: '#374151' }}>기본 통계</p>
						{[
							{ label: '전체 페이지', value: `${studentMetrics.totalPages.toLocaleString()}p` },
							{ label: '완료 교재',   value: `${studentMetrics.totalFinished}권` },
							{
								label: '유효 수업일',
								value: sheetMetrics.length > 0
									? `${Math.max(...sheetMetrics.map(sm => sm.daysElapsed))}일 이상`
									: '-',
							},
						].map((item, i) => (
							<div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 10px', marginBottom: 6 }}>
								<p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>{item.label}</p>
								<p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700 }}>{item.value}</p>
							</div>
						))}
					</div>

					{/* Column 2: pie chart + legend */}
					{studentMetrics.subjectComposition.length > 0 && (
						<div style={{ width: COL2, flexShrink: 0 }}>
							<p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, color: '#374151' }}>과목별 비율</p>
							<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
								{pieChartUrl ? (
									<img src={pieChartUrl} width={110} height={110} alt="" style={{ borderRadius: '50%', display: 'block', flexShrink: 0 }} />
								) : (
									<div style={{ width: 110, height: 110, borderRadius: '50%', background: '#f3f4f6', flexShrink: 0 }} />
								)}
								<div>
									{studentMetrics.subjectComposition.map((entry, i) => (
										<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
											<div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length], flexShrink: 0 }} />
											<span style={{ fontSize: 11, color: '#374151' }}>{entry.subject}</span>
											<span style={{ fontSize: 11, color: '#9ca3af' }}>
												{pieTotal > 0 ? `${((entry.pages / pieTotal) * 100).toFixed(0)}%` : ''}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Column 3: 4 metric cards (2×2) with pin charts */}
					<div style={{ flex: 1 }}>
						<p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, color: '#374151' }}>학습 효율 지표</p>
						<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
							{metricCard('평균 페이지 (PPD)', `${fmt(studentMetrics.ppd)}p/일`,
								crossValues?.ppd ?? [], studentMetrics.ppd,
								v => `${v.toFixed(1)}p`)}
							{metricCard('교재당 소모일 (DPB)', studentMetrics.dpb > 0 ? `${fmt(studentMetrics.dpb)}일` : '-',
								crossValues?.dpb ?? [], studentMetrics.dpb > 0 ? studentMetrics.dpb : null,
								v => `${Math.round(v)}일`)}
							{metricCard('평균 페이스 (AP)', pct(studentMetrics.ap),
								crossValues?.ap ?? [], studentMetrics.ap,
								v => `${(v * 100).toFixed(0)}%`)}
							{metricCard('밀림율 (DR)', pct(studentMetrics.dr),
								crossValues?.dr ?? [], studentMetrics.dr,
								v => `${(v * 100).toFixed(0)}%`)}
						</div>
					</div>
				</div>

				{/* Sheet table */}
				{sheetMetrics.length > 0 && (
					<div>
						<p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, color: '#374151' }}>교재별 상세</p>
						<table style={{ width: '100%', borderCollapse: 'collapse' }}>
							<thead>
								<tr style={{ backgroundColor: '#f9fafb' }}>
									<th style={{ ...cell, fontWeight: 600 }}>교재명</th>
									<th style={{ ...cell, fontWeight: 600, textAlign: 'right' }}>소요일</th>
									<th style={{ ...cell, fontWeight: 600, textAlign: 'right' }}>평균 페이스 (AP)</th>
									<th style={{ ...cell, fontWeight: 600, textAlign: 'right' }}>밀림율 (DR)</th>
								</tr>
							</thead>
							<tbody>
								{sheetMetrics.map((sm) => (
									<tr key={sm.sheet.id}>
										<td style={{ ...cell }}>
											<span style={{ display: 'block' }}>{sm.sheet.textbook_detail.name}</span>
											<span style={{ fontSize: 9, color: '#9ca3af' }}>{sm.sheet.textbook_detail.subject} · {shortDate(sm.firstDate)} ~ {shortDate(sm.lastDate)}</span>
										</td>
										<td style={{ ...cell, textAlign: 'right' }}>{sm.daysElapsed}일</td>
										<td style={{ ...cell, textAlign: 'right' }}>{pct(sm.ap)}</td>
										<td style={{ ...cell, textAlign: 'right' }}>{pct(sm.dr)}</td>
									</tr>
								))}
							</tbody>
							{sheetMetrics.length > 1 && (
								<tfoot>
									<tr style={{ borderTop: '2px solid #e5e7eb', fontWeight: 600, color: '#6b7280' }}>
										<td style={cell}>평균</td>
										<td style={{ ...cell, textAlign: 'right' }}>{sheetAvgDays !== null ? `${fmt(sheetAvgDays, 0)}일` : '-'}</td>
										<td style={{ ...cell, textAlign: 'right' }}>{pct(sheetAvgAP)}</td>
										<td style={{ ...cell, textAlign: 'right' }}>{pct(sheetAvgDR)}</td>
									</tr>
								</tfoot>
							)}
						</table>
					</div>
				)}
			</div>
		);
	},
);

StatsReport.displayName = 'StatsReport';
export default StatsReport;
