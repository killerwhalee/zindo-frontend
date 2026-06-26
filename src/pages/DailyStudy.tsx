import { useEffect, useState } from 'react';
import { TrophyIcon } from 'lucide-react';
import api from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Skeleton } from '@/components/ui/skeleton';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import type { Record as LearningRecord, Student } from '@/components/types';

function toSeoulDate(): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}

function formatTime(isoStr: string): string {
	return new Date(isoStr).toLocaleTimeString('ko-KR', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
		timeZone: 'Asia/Seoul',
	});
}

const RANK_LABELS = ['🥇', '🥈', '🥉'];

function GroupSection({
	title,
	students,
	badgeClass,
}: {
	title: string;
	students: Student[];
	badgeClass: string;
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<h3 className="text-sm font-semibold">{title}</h3>
				<span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
					{students.length}명
				</span>
			</div>
			{students.length === 0 ? (
				<p className="text-xs text-muted-foreground">아직 없습니다</p>
			) : (
				<div className="flex flex-wrap gap-1.5">
					{students.map((s) => (
						<span
							key={s.id}
							className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}
						>
							{s.name}
						</span>
					))}
				</div>
			)}
		</div>
	);
}

export default function DailyStudy() {
	const [students, setStudents] = useState<Student[]>([]);
	const [studentLastRecord, setStudentLastRecord] = useState<Map<number, string>>(new Map());
	const [loading, setLoading] = useState(true);

	const fetchData = async () => {
		try {
			const today = toSeoulDate();
			const [studentsRes, recordsRes] = await Promise.all([
				api.get('/zindo/students/', { params: { ordering: 'name' } }),
				api.get('/zindo/records/', {
					params: { created_at__date__gte: today, created_at__date__lte: today },
				}),
			]);
			setStudents(studentsRes.data);

			const lastRecord = new Map<number, string>();
			for (const record of recordsRes.data as LearningRecord[]) {
				const studentId = record.sheet_detail.student_detail.id;
				const current = lastRecord.get(studentId);
				if (!current || record.created_at > current) {
					lastRecord.set(studentId, record.created_at);
				}
			}
			setStudentLastRecord(lastRecord);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { fetchData(); }, []);

	const { refreshState, pullDistance } = usePullToRefresh(fetchData);

	const active = students.filter((s) => s.is_active && s.count_on_progress > 0);
	const finished = active.filter((s) => s.count_recorded === s.count_on_progress);
	const partial = active.filter(
		(s) => s.count_recorded >= 1 && s.count_recorded < s.count_on_progress,
	);
	const none = active.filter((s) => s.count_recorded === 0);

	// Top 3: sort finished students by their last-record time ascending (earliest finisher first)
	const top3 = [...finished]
		.filter((s) => studentLastRecord.has(s.id))
		.sort((a, b) => {
			const aTime = studentLastRecord.get(a.id) ?? '';
			const bTime = studentLastRecord.get(b.id) ?? '';
			return aTime.localeCompare(bTime);
		})
		.slice(0, 3);

	return (
		<div className="pt-16">
			<TopBar title="오늘의 학습상황" />
			<PullToRefreshIndicator refreshState={refreshState} pullDistance={pullDistance} />

			<div className="p-4 space-y-6">
				{loading ? (
					<div className="space-y-5">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-5 w-28" />
								<div className="flex flex-wrap gap-1.5">
									{[...Array(4)].map((_, j) => (
										<Skeleton key={j} className="h-6 w-12 rounded-full" />
									))}
								</div>
							</div>
						))}
					</div>
				) : (
					<>
						{/* Top 3 spotlight with rank and time */}
						{top3.length > 0 && (
							<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
								<div className="flex items-center gap-2">
									<TrophyIcon className="size-4 text-amber-500" />
									<span className="text-sm font-semibold text-amber-700">
										오늘의 기록
									</span>
								</div>
								<div className="space-y-1.5">
									{top3.map((s, i) => (
										<div key={s.id} className="flex items-center gap-2">
											<span className="text-sm w-6 text-center">{RANK_LABELS[i]}</span>
											<span className="text-sm font-medium text-amber-900">{s.name}</span>
											<span className="text-xs text-amber-600 ml-auto">
												{studentLastRecord.has(s.id)
													? formatTime(studentLastRecord.get(s.id)!)
													: ''}
											</span>
										</div>
									))}
								</div>
							</div>
						)}

						<GroupSection
							title="학습 완료"
							students={finished}
							badgeClass="bg-green-100 text-green-800 border-green-300"
						/>
						<GroupSection
							title="일부 완료"
							students={partial}
							badgeClass="bg-amber-100 text-amber-800 border-amber-300"
						/>
						<GroupSection
							title="미완료"
							students={none}
							badgeClass="bg-muted text-muted-foreground border-border"
						/>
					</>
				)}
			</div>
		</div>
	);
}
