import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon, ChevronRightIcon, SlidersHorizontalIcon } from 'lucide-react';
import api from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { convertGrade } from '@/lib/utils';
import StatsReport from '@/pages/Stats/StatsReport';
import { dateRangeLabel, useBatchContext } from '@/pages/Stats/batchShared';

export default function StatsBatchOverview() {
	const navigate = useNavigate();
	const {
		batch,
		students,
		metricsResults,
		crossValues,
		globalNewsletter,
		setGlobalNewsletter,
		studentNewsletters,
	} = useBatchContext();

	const [pdfLoading, setPdfLoading] = useState(false);
	const batchReportRef = useRef<HTMLDivElement>(null);

	const saveGlobalNewsletter = async (value: string) => {
		try { await api.patch(`/zindo/stats-batches/${batch.id}/`, { global_newsletter: value }); }
		catch (e) { console.error(e); }
	};

	const handleExportPdf = async () => {
		if (!batchReportRef.current || metricsResults.length === 0) return;
		setPdfLoading(true);
		try {
			const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
				import('html2canvas'),
				import('jspdf'),
			]);

			const onclone = (clonedDoc: Document) => {
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
			};

			const SCALE = 1.5;
			const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
			const MARGIN = 10, contentW = 190, pageH_MM = 277;

			// Each StatsReport renders exactly two pages: everything above [data-pdf-page2]
			// → page 1, [data-pdf-page2] and below → page 2. Pages taller than A4 are
			// compressed vertically by capping imgH at pageH_MM.
			let firstPdf = true;
			const reportDivs = Array.from(batchReportRef.current.children) as HTMLElement[];
			for (const reportDiv of reportDivs) {
				const canvas = await html2canvas(reportDiv, {
					scale: SCALE,
					useCORS: true,
					imageTimeout: 15000,
					onclone,
				});

				const page2El = reportDiv.querySelector('[data-pdf-page2]') as HTMLElement | null;
				const elTop = reportDiv.getBoundingClientRect().top;
				const cutPx = page2El
					? Math.round((page2El.getBoundingClientRect().top - elTop) * SCALE)
					: canvas.height;

				const slices = [
					{ yStart: 0, yEnd: cutPx },
					{ yStart: cutPx, yEnd: canvas.height },
				];

				for (const { yStart, yEnd } of slices) {
					const sliceH = yEnd - yStart;
					if (sliceH <= 0) continue;
					const slice = document.createElement('canvas');
					slice.width = canvas.width;
					slice.height = sliceH;
					const ctx = slice.getContext('2d')!;
					ctx.fillStyle = '#ffffff';
					ctx.fillRect(0, 0, slice.width, slice.height);
					ctx.drawImage(canvas, 0, -yStart);
					const naturalH_mm = (sliceH / canvas.width) * contentW;
					const imgH = Math.min(pageH_MM, naturalH_mm);
					if (!firstPdf) pdf.addPage();
					firstPdf = false;
					pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN, MARGIN, contentW, imgH);
				}
			}

			pdf.save(`${batch.title}.pdf`);
		} catch (e) {
			console.error('PDF export failed:', e);
		} finally {
			setPdfLoading(false);
		}
	};

	return (
		<div className="pt-16 pb-8">
			<TopBar title={batch.title} />

			<div className="p-4 space-y-6">
				{/* Batch info */}
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
						{dateRangeLabel(batch.start_date, batch.end_date)}
					</span>
					<span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
						학생 {batch.student_ids.length}명
					</span>
					<Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate('edit')}>
						<SlidersHorizontalIcon className="size-4 mr-1" />
						설정 변경
					</Button>
				</div>

				{/* Global newsletter */}
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">전체 가정통신문</h3>
					<Textarea
						value={globalNewsletter}
						onChange={(e) => setGlobalNewsletter(e.target.value)}
						onBlur={(e) => saveGlobalNewsletter(e.target.value)}
						placeholder="모든 학생에게 공통으로 전달할 내용을 입력하세요"
						className="min-h-[120px] resize-none"
					/>
				</div>

				<Separator />

				{/* Student list */}
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">학생별</h3>
					{students.map((student) => {
						const hasNewsletter = !!(studentNewsletters[String(student.id)]?.trim());
						return (
							<div key={student.id} className="flex items-center gap-2 p-3 border rounded-lg">
								<div className="flex-1 min-w-0">
									<p className="font-medium text-sm">{student.name}</p>
									<p className="text-xs text-muted-foreground">{convertGrade(student.grade)}</p>
								</div>
								<Button size="sm" variant="outline" onClick={() => navigate(`student/${student.id}`)}>
									통계 보기
								</Button>
								<Button
									size="sm"
									variant={hasNewsletter ? 'default' : 'outline'}
									onClick={() => navigate(`student/${student.id}/newsletter`)}
								>
									{hasNewsletter && <CheckIcon className="size-3.5 mr-1" />}
									가정통신문
									<ChevronRightIcon className="size-3.5 ml-0.5" />
								</Button>
							</div>
						);
					})}
				</div>

				<Button className="w-full" onClick={handleExportPdf} disabled={pdfLoading}>
					{pdfLoading ? '저장 중...' : 'PDF 내보내기'}
				</Button>
			</div>

			{/* Off-screen report for PDF */}
			{metricsResults.length > 0 && (
				<div style={{ position: 'fixed', top: 0, left: '-9999px', width: '710px', pointerEvents: 'none' }}>
					<div ref={batchReportRef}>
						{metricsResults.map((result, i) => {
							const student = students[i];
							if (!student) return null;
							const finishedSheets = result.sheetMetrics.filter(
								(sm) => sm.sheet.is_finished && sm.daysElapsed > 0,
							);
							return (
								<StatsReport
									key={result.studentId}
									student={student}
									startDate={batch.start_date ?? ''}
									endDate={batch.end_date ?? ''}
									studentMetrics={result.studentMetrics}
									sheetMetrics={finishedSheets}
									validDays={new Set()}
									pieChartUrl={result.pieChartUrl}
									crossValues={crossValues}
									personalNewsletter={studentNewsletters[String(result.studentId)] || undefined}
									globalNewsletter={globalNewsletter || undefined}
								/>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
