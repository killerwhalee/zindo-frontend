import { forwardRef, useLayoutEffect, useRef } from 'react';
import { convertGrade } from '@/lib/utils';
import type { Student } from '@/components/types';
import type { SheetMetrics, StudentMetrics } from '@/lib/stats';

// No Recharts — html2canvas cannot parse oklch() from SVG.
// Pie chart is a pre-rendered PNG data URL. All charts use inline HTML/CSS.

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
					position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center',
					left: pos(pin.value), transform: 'translateX(-50%)', top: 0, bottom: 0, zIndex: pin.z,
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
	personalNewsletter?: string;
	globalNewsletter?: string;
}

const cell: React.CSSProperties = {
	border: '1px solid #e5e7eb',
	padding: '3px 6px',
	fontSize: 9,
	textAlign: 'left',
};

const LEFT_COL = 220;
const GAP = 14;
const RIGHT_COL = 662 - LEFT_COL - GAP; // 428px
const STAT_BOX_W = (LEFT_COL - 8) / 2;   // 106px
const METRIC_CARD_W = (RIGHT_COL - 8) / 2; // 210px

// One A4 page height in CSS pixels at the 710px report width.
// A4 content area: 277mm tall × 190mm wide; 710px / 190mm = 3.737 px/mm.
const PAGE_H = Math.round(277 * 710 / 190); // 1035px

const StatsReport = forwardRef<HTMLDivElement, Props>(
	({ student, startDate, endDate, studentMetrics, sheetMetrics, pieChartUrl, crossValues, personalNewsletter, globalNewsletter }, ref) => {
		const pieTotal = studentMetrics.subjectComposition.reduce((s, e) => s + e.pages, 0);

		// Refs for targeted vertical compression of specific sections only.
		const page1Ref = useRef<HTMLDivElement>(null);
		const sheetSectionRef = useRef<HTMLDivElement>(null);
		const page2Ref = useRef<HTMLDivElement>(null);
		const newsletterBoxesRef = useRef<HTMLDivElement>(null);

		useLayoutEffect(() => {
			// Compress only `sectionEl` until `pageEl` fits within PAGE_H.
			// zoom affects layout (unlike scaleY), so scrollHeight reflects the new size.
			const fitSection = (pageEl: HTMLDivElement | null, sectionEl: HTMLDivElement | null) => {
				if (!pageEl || !sectionEl) return;
				sectionEl.style.zoom = '1';
				const pageH = pageEl.scrollHeight;
				const sectionH = sectionEl.scrollHeight;
				if (pageH <= PAGE_H || sectionH === 0) return;
				const zoom = (sectionH - (pageH - PAGE_H)) / sectionH;
				if (zoom > 0) sectionEl.style.zoom = String(zoom);
			};
			fitSection(page1Ref.current, sheetSectionRef.current);
			fitSection(page2Ref.current, newsletterBoxesRef.current);
		});

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

		const pageHeader = (title: string) => (
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #111827', paddingBottom: 10, marginBottom: 16 }}>
				<h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</h1>
				<p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
					{convertGrade(student.grade)} &nbsp;|&nbsp; {dateLabel}
				</p>
			</div>
		);

		return (
			<div ref={ref} style={{ width: 710, fontFamily: 'sans-serif', color: '#111827', backgroundColor: '#ffffff' }}>

				{/* ── PAGE 1: 학습 통계 ── */}
				<div ref={page1Ref} style={{ padding: 24, boxSizing: 'border-box' }}>
					{pageHeader(`${student.name} 학습 통계 보고서`)}

					{/* Section 1: 기본 통계 + 학습 효율 지표 */}
					<div style={{ display: 'flex', gap: GAP, marginBottom: 16, alignItems: 'flex-start' }}>
						{/* Left: basic stats + pie */}
						<div style={{ width: LEFT_COL, flexShrink: 0 }}>
							<p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, color: '#374151' }}>기본 통계</p>
							<div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
								{[
									{ label: '전체 페이지', value: `${studentMetrics.totalPages.toLocaleString()}p` },
									{ label: '완료 교재',   value: `${studentMetrics.totalFinished}권` },
								].map((item, i) => (
									<div key={i} style={{ width: STAT_BOX_W, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 10px', boxSizing: 'border-box' }}>
										<p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>{item.label}</p>
										<p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700 }}>{item.value}</p>
									</div>
								))}
							</div>

							{studentMetrics.subjectComposition.length > 0 && (
								<div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 10px' }}>
									<p style={{ margin: '0 0 8px', fontSize: 9, color: '#6b7280' }}>과목별 비율</p>
									<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
										{pieChartUrl ? (
											<img src={pieChartUrl} width={80} height={80} alt="" style={{ borderRadius: '50%', display: 'block', flexShrink: 0 }} />
										) : (
											<div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f3f4f6', flexShrink: 0 }} />
										)}
										<div>
											{studentMetrics.subjectComposition.map((entry, i) => (
												<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
													<div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length], flexShrink: 0 }} />
													<span style={{ fontSize: 10, color: '#374151' }}>{entry.subject}</span>
													<span style={{ fontSize: 10, color: '#9ca3af' }}>
														{pieTotal > 0 ? `${((entry.pages / pieTotal) * 100).toFixed(0)}%` : ''}
													</span>
												</div>
											))}
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Right: efficiency metrics */}
						<div style={{ flex: 1 }}>
							<p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, color: '#374151' }}>학습 효율 지표</p>
							<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
								{metricCard('일일 평균 페이지 (PPD)', `${fmt(studentMetrics.ppd)}p/일`,
									crossValues?.ppd ?? [], studentMetrics.ppd, v => `${v.toFixed(1)}p`)}
								{metricCard('교재당 소모일 (DPB)', studentMetrics.dpb > 0 ? `${fmt(studentMetrics.dpb)}일` : '-',
									crossValues?.dpb ?? [], studentMetrics.dpb > 0 ? studentMetrics.dpb : null, v => `${Math.round(v)}일`)}
								{metricCard('평균 페이스 (AP)', pct(studentMetrics.ap),
									crossValues?.ap ?? [], studentMetrics.ap, v => `${(v * 100).toFixed(0)}%`)}
								{metricCard('밀림율 (DR)', pct(studentMetrics.dr),
									crossValues?.dr ?? [], studentMetrics.dr, v => `${(v * 100).toFixed(0)}%`)}
							</div>
						</div>
					</div>

					{/* Section 2: 지표 설명 */}
					<div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginBottom: sheetMetrics.length > 0 ? 16 : 0 }}>
						<p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>지표 설명</p>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
							{[
								{
									abbr: 'PPD', name: '일일 평균 페이지',
									formula: '(전체 학습 페이지 수) ÷ (기간 내 유효 수업일수)',
									desc: '기간 중 수업이 있었던 날 수를 기준으로, 하루 평균 몇 페이지를 학습했는지 나타냅니다.',
								},
								{
									abbr: 'DPB', name: '교재당 소모일',
									formula: 'Σ(완료 교재 소요일) ÷ (완료 교재 수)',
									desc: '교재 한 권을 끝내는 데 걸린 유효 수업일 평균입니다.',
								},
								{
									abbr: 'AP', name: '평균 페이스',
									formula: '(전체 학습 페이지 수) ÷ Σ(목표 학습량 × 소요일)',
									desc: '목표 일일 학습량에 대한 실제 학습 비율입니다. 100%이면 계획대로, 초과면 목표보다 빠릅니다.',
								},
								{
									abbr: 'DR', name: '밀림율',
									formula: '1 - Σ(교재별 기록일수) ÷ Σ(교재별 유효 수업일수)',
									desc: '유효 수업일 중 기록하지 않은 날의 비율입니다. 0%에 가까울수록 꾸준히 학습했습니다.',
								},
							].map((m, i) => (
								<div key={i} style={{ background: '#f9fafb', borderRadius: 5, padding: '6px 8px' }}>
									<p style={{ margin: '0 0 2px', fontSize: 10, color: '#111827' }}>
										<span style={{ fontWeight: 700 }}>{m.name}</span>
										<span style={{ color: '#6b7280' }}> ({m.abbr})</span>
										<span style={{ color: '#3b82f6', fontFamily: 'monospace', marginLeft: 6, fontSize: 9 }}>= {m.formula}</span>
									</p>
									<p style={{ margin: 0, fontSize: 8.5, color: '#6b7280', lineHeight: 1.5 }}>{m.desc}</p>
								</div>
							))}
						</div>
					</div>

					{/* Section 3: 교재별 상세 — compressed vertically if page 1 overflows */}
					{sheetMetrics.length > 0 && (
						<div ref={sheetSectionRef} style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
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
												<span style={{ fontSize: 8, color: '#9ca3af' }}>{sm.sheet.textbook_detail.subject} · {shortDate(sm.firstDate)} ~ {shortDate(sm.lastDate)}</span>
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

				{/* ── PAGE 2: 가정통신문 ──
				    data-pdf-page2 marks the cut point for PDF generation.
				    Everything above this element goes on page 1; this and below → page 2. */}
				<div data-pdf-page2 ref={page2Ref} style={{ padding: 24, boxSizing: 'border-box' }}>
					{pageHeader(`${student.name} 가정통신문`)}

					{/* Newsletter boxes — compressed vertically if page 2 overflows */}
					<div ref={newsletterBoxesRef} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
						<div style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '10px 12px' }}>
							<p style={{ margin: '0 0 6px', fontSize: 9, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>전체 가정통신문</p>
							{globalNewsletter
								? <p style={{ margin: 0, fontSize: 11, color: '#111827', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{globalNewsletter}</p>
								: <p style={{ margin: 0, fontSize: 10, color: '#d1d5db', fontStyle: 'italic' }}>(내용 없음)</p>
							}
						</div>
						<div style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '10px 12px' }}>
							<p style={{ margin: '0 0 6px', fontSize: 9, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>개별 가정통신문</p>
							{personalNewsletter
								? <p style={{ margin: 0, fontSize: 11, color: '#111827', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{personalNewsletter}</p>
								: <p style={{ margin: 0, fontSize: 10, color: '#d1d5db', fontStyle: 'italic' }}>(내용 없음)</p>
							}
						</div>
					</div>
				</div>
			</div>
		);
	},
);

StatsReport.displayName = 'StatsReport';
export default StatsReport;
