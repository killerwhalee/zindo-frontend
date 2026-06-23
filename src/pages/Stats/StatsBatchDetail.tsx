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
 * Layout route for `/stats/batch/:batchId`. Loads the batch and computes metrics
 * for every student once, then shares everything with its child pages (overview,
 * per-student stats, newsletter editor, settings) through <Outlet context>.
 */
export default function StatsBatchDetail() {
	const { batchId } = useParams<{ batchId: string }>();

	const [batch, setBatch] = useState<StatsBatch | null>(null);
	const [students, setStudents] = useState<Student[]>([]);
	const [metricsResults, setMetricsResults] = useState<StudentMetricsResult[]>([]);
	const [crossValues, setCrossValues] = useState<CrossStudentValues | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadingStep, setLoadingStep] = useState('불러오는 중...');

	const [globalNewsletter, setGlobalNewsletter] = useState('');
	const [studentNewsletters, setStudentNewsletters] = useState<Record<string, string>>({});

	const load = useCallback(async () => {
		if (!batchId) return;
		setLoading(true);
		try {
			setLoadingStep('가정통신문 정보를 불러오는 중...');
			const batchRes = await api.get(`/zindo/stats-batches/${batchId}/`);
			const b: StatsBatch = batchRes.data;
			setBatch(b);
			setGlobalNewsletter(b.global_newsletter);
			setStudentNewsletters(b.student_newsletters);

			setLoadingStep(`전체 기록 및 학생 정보를 불러오는 중... (학생 ${b.student_ids.length}명)`);
			const [allRecordsRes, ...studentDetailResults] = await Promise.all([
				api.get('/zindo/records/'),
				...b.student_ids.map((id) => api.get(`/zindo/students/${id}/`)),
			]);

			const allRecords: LearningRecord[] = allRecordsRes.data;
			const globalValidDays = getValidDays(allRecords);
			setStudents(studentDetailResults.map((r) => r.data));

			setLoadingStep(`학생별 학습 기록을 불러오는 중... (시간이 걸릴 수 있습니다)`);
			const studentRecordsResults = await Promise.all(
				b.student_ids.map((id) =>
					api.get('/zindo/records/', { params: { sheet__student__id: id } }),
				),
			);

			setLoadingStep('통계를 계산하는 중...');
			const results: StudentMetricsResult[] = b.student_ids.map((id, i) => {
				const { sheetMetrics, studentMetrics } = computeStudentMetricsFromRecords(
					studentRecordsResults[i].data,
					globalValidDays,
					b.start_date ?? '',
					b.end_date ?? '',
				);
				return { studentId: id, sheetMetrics, studentMetrics, pieChartUrl: renderPieChartUrl(studentMetrics.subjectComposition) };
			});
			setMetricsResults(results);

			const allSM = results.map((r) => r.studentMetrics);
			setCrossValues({
				ppd: allSM.map((m) => m.ppd),
				dpb: allSM.filter((m) => m.dpb > 0).map((m) => m.dpb),
				ap: allSM.filter((m) => m.ap !== null).map((m) => m.ap as number),
				dr: allSM.map((m) => m.dr),
			});
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	}, [batchId]);

	useEffect(() => { load(); }, [load]);

	if (loading) {
		return (
			<div className="pt-16 pb-8">
				<TopBar title="가정통신문" />
				<div className="flex flex-col items-center justify-center min-h-[60vh] p-8 gap-5 text-center">
					<div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					<div className="space-y-1">
						<p className="font-semibold">통계를 불러오는 중입니다</p>
						<p className="text-sm text-muted-foreground">{loadingStep}</p>
					</div>
					<p className="text-xs text-muted-foreground max-w-[260px]">
						학생 수가 많을수록 시간이 걸릴 수 있습니다. 잠시만 기다려 주세요.
					</p>
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
		globalNewsletter,
		setGlobalNewsletter,
		studentNewsletters,
		setStudentNewsletters,
		reload: load,
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
