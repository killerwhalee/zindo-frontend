import { Suspense, useCallback, useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import api from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import type { Record as LearningRecord, StatsBatch, Student } from '@/components/types';
import {
	computeStudentMetricsFromRecords,
	getValidDays,
	renderPieChartUrl,
} from '@/lib/stats';
import type { CrossStudentValues } from '@/pages/Stats/StatsReport';
import type { BatchContext, StudentMetricsResult } from '@/pages/Stats/batchShared';

/**
 * Layout route for `/stats/batch/:batchId`.
 *
 * Two-phase loading:
 * 1. Fast load (on mount): batch metadata + student details. Populates `batch` and
 *    `students` so newsletters and settings are usable without delay.
 * 2. On-demand load (user-triggered via `loadData`): all records + per-student records
 *    + metrics computation. Sets `dataLoaded = true` when complete.
 *
 * `reload()` re-runs the fast load only and resets `dataLoaded` so stale metrics are cleared.
 */
export default function StatsBatchDetail() {
	const { batchId } = useParams<{ batchId: string }>();

	const [batch, setBatch] = useState<StatsBatch | null>(null);
	const [batchLoading, setBatchLoading] = useState(true);
	const [students, setStudents] = useState<Student[]>([]);

	const [dataLoaded, setDataLoaded] = useState(false);
	const [dataLoading, setDataLoading] = useState(false);
	const [metricsResults, setMetricsResults] = useState<StudentMetricsResult[]>([]);
	const [crossValues, setCrossValues] = useState<CrossStudentValues | null>(null);

	const [globalNewsletter, setGlobalNewsletter] = useState('');
	const [studentNewsletters, setStudentNewsletters] = useState<Record<string, string>>({});

	const loadBatch = useCallback(async () => {
		if (!batchId) return;
		setBatchLoading(true);
		setDataLoaded(false);
		setMetricsResults([]);
		setCrossValues(null);
		try {
			const batchRes = await api.get(`/zindo/stats-batches/${batchId}/`);
			const b: StatsBatch = batchRes.data;
			setBatch(b);
			setGlobalNewsletter(b.global_newsletter);
			setStudentNewsletters(b.student_newsletters);

			const studentResults = await Promise.all(
				b.student_ids.map((id) => api.get(`/zindo/students/${id}/`)),
			);
			setStudents(studentResults.map((r) => r.data));
		} catch (e) {
			console.error(e);
		} finally {
			setBatchLoading(false);
		}
	}, [batchId]);

	const loadData = useCallback(async () => {
		if (!batch || dataLoading) return;
		setDataLoading(true);
		setDataLoaded(false);
		setMetricsResults([]);
		setCrossValues(null);
		try {
			const [allRecordsRes, ...studentRecordsResults] = await Promise.all([
				api.get('/zindo/records/'),
				...batch.student_ids.map((id) =>
					api.get('/zindo/records/', { params: { sheet__student__id: id } }),
				),
			]);

			const globalValidDays = getValidDays(allRecordsRes.data as LearningRecord[]);

			const results: StudentMetricsResult[] = batch.student_ids.map((id, i) => {
				const { sheetMetrics, studentMetrics } = computeStudentMetricsFromRecords(
					studentRecordsResults[i].data,
					globalValidDays,
					batch.start_date ?? '',
					batch.end_date ?? '',
				);
				return {
					studentId: id,
					sheetMetrics,
					studentMetrics,
					pieChartUrl: renderPieChartUrl(studentMetrics.subjectComposition),
				};
			});
			setMetricsResults(results);

			const allSM = results.map((r) => r.studentMetrics);
			setCrossValues({
				ppd: allSM.map((m) => m.ppd),
				dpb: allSM.filter((m) => m.dpb > 0).map((m) => m.dpb),
				ap: allSM.filter((m) => m.ap !== null).map((m) => m.ap as number),
				dr: allSM.map((m) => m.dr),
			});
			setDataLoaded(true);
		} catch (e) {
			console.error(e);
		} finally {
			setDataLoading(false);
		}
	}, [batch, dataLoading]);

	useEffect(() => { loadBatch(); }, [loadBatch]);

	if (batchLoading) {
		return (
			<div className="pt-16 pb-8">
				<TopBar title="가정통신문" />
				<div className="flex items-center justify-center min-h-[40vh]">
					<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (!batch) return null;

	const context: BatchContext = {
		batch,
		students,
		metricsResults,
		crossValues,
		dataLoaded,
		dataLoading,
		loadData,
		globalNewsletter,
		setGlobalNewsletter,
		studentNewsletters,
		setStudentNewsletters,
		reload: loadBatch,
	};

	return (
		<Suspense
			fallback={
				<div className="pt-16 pb-8">
					<TopBar title={batch.title} />
					<div className="flex items-center justify-center min-h-[40vh]">
						<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
				</div>
			}
		>
			<Outlet context={context} />
		</Suspense>
	);
}
