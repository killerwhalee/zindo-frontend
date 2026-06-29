import { useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, TrophyIcon } from 'lucide-react';
import api from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import type { Record as LearningRecord, Student } from '@/components/types';

function toSeoulDate(): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}

// Shift a 'YYYY-MM-DD' string by a number of days, staying timezone-agnostic.
function shiftDate(dateStr: string, days: number): string {
	const [y, m, d] = dateStr.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));
	dt.setUTCDate(dt.getUTCDate() + days);
	return dt.toISOString().slice(0, 10);
}

// Format a 'YYYY-MM-DD' string as e.g. "6월 28일 (토)".
function formatDateLabel(dateStr: string): string {
	const [y, m, d] = dateStr.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));
	return new Intl.DateTimeFormat('ko-KR', {
		month: 'long',
		day: 'numeric',
		weekday: 'short',
		timeZone: 'UTC',
	}).format(dt);
}

// Whole-day difference a - b for two 'YYYY-MM-DD' strings.
function daysBetween(a: string, b: string): number {
	const [ay, am, ad] = a.split('-').map(Number);
	const [by, bm, bd] = b.split('-').map(Number);
	return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
}

// Stop auto-skipping empty days after this many days back, so a fresh
// install (no records at all) doesn't loop into the distant past.
const MAX_SKIP_DAYS = 90;

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
	const today = toSeoulDate();

	const [selectedDate, setSelectedDate] = useState(today);
	// Navigation direction (-1 / 1), used to skip past empty days; 0 = no skip.
	const [direction, setDirection] = useState(0);
	const [students, setStudents] = useState<Student[]>([]);
	const [studentLastRecord, setStudentLastRecord] = useState<Map<number, string>>(new Map());
	// Distinct sheets recorded per student on the selected date.
	const [studentRecordedCount, setStudentRecordedCount] = useState<Map<number, number>>(new Map());
	const [loading, setLoading] = useState(true);

	const isToday = selectedDate >= today;

	const fetchData = async () => {
		try {
			const [studentsRes, recordsRes] = await Promise.all([
				api.get('/zindo/students/', { params: { ordering: 'name' } }),
				api.get('/zindo/records/', {
					params: {
						created_at__date__gte: selectedDate,
						created_at__date__lte: selectedDate,
					},
				}),
			]);
			const records = recordsRes.data as LearningRecord[];

			// Skip days with no activity (holiday/weekend) while navigating —
			// keep moving in the same direction until a day has records. Today
			// is always shown, and we stop after MAX_SKIP_DAYS going back.
			if (
				records.length === 0 &&
				direction !== 0 &&
				selectedDate < today &&
				daysBetween(today, selectedDate) < MAX_SKIP_DAYS
			) {
				setSelectedDate((d) => shiftDate(d, direction));
				return; // stay in loading state; the effect re-runs for the new date
			}

			setStudents(studentsRes.data);

			const lastRecord = new Map<number, string>();
			const recordedSheets = new Map<number, Set<number>>();
			for (const record of records) {
				const studentId = record.sheet_detail.student_detail.id;
				const current = lastRecord.get(studentId);
				if (!current || record.created_at > current) {
					lastRecord.set(studentId, record.created_at);
				}

				let sheets = recordedSheets.get(studentId);
				if (!sheets) {
					sheets = new Set();
					recordedSheets.set(studentId, sheets);
				}
				sheets.add(record.sheet_detail.id);
			}
			setStudentLastRecord(lastRecord);

			const recordedCount = new Map<number, number>();
			recordedSheets.forEach((sheets, id) => recordedCount.set(id, sheets.size));
			setStudentRecordedCount(recordedCount);
		} catch (e) {
			console.error(e);
		}
		setDirection(0);
		setLoading(false);
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedDate]);

	const { refreshState, pullDistance } = usePullToRefresh(fetchData);

	function changeDate(days: number) {
		setLoading(true);
		setDirection(days > 0 ? 1 : -1);
		setSelectedDate((d) => shiftDate(d, days));
	}

	const recordedOf = (s: Student) => studentRecordedCount.get(s.id) ?? 0;

	const active = students.filter((s) => s.is_active && s.count_on_progress > 0);
	const finished = active.filter((s) => recordedOf(s) >= s.count_on_progress);
	const partial = active.filter(
		(s) => recordedOf(s) >= 1 && recordedOf(s) < s.count_on_progress,
	);
	const none = active.filter((s) => recordedOf(s) === 0);

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
				{/* Date navigation */}
				<div className="flex items-center justify-center gap-4">
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={() => changeDate(-1)}
						aria-label="이전 날짜"
					>
						<ChevronLeftIcon />
					</Button>
					<span className="text-2xl font-bold min-w-44 text-center">
						{formatDateLabel(selectedDate)}
					</span>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={() => changeDate(1)}
						disabled={isToday}
						aria-label="다음 날짜"
					>
						<ChevronRightIcon />
					</Button>
				</div>

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
										{isToday ? '오늘의 기록' : `${formatDateLabel(selectedDate)} 기록`}
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
