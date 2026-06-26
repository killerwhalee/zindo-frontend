import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TopBar from '@/components/layout/TopBar';
import type { Student } from '@/components/types';
import {
	ArrowDownIcon,
	ArrowUpIcon,
	ChevronRightIcon,
	SearchIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { convertGrade } from '@/lib/utils';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';

type Ordering = 'name' | '-name' | 'admission_date' | '-admission_date';

export default function StatsStudentList() {
	const navigate = useNavigate();
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);
	const [ordering, setOrdering] = useState<Ordering>('name');
	const [search, setSearch] = useState('');

	const { refreshState, pullDistance } = usePullToRefresh(() =>
		fetchStudents(ordering),
	);

	const fetchStudents = (orderingValue: Ordering) => {
		setLoading(true);
		api
			.get('/zindo/students/', {
				params: orderingValue ? { ordering: orderingValue } : {},
			})
			.then((res) => setStudents(res.data))
			.catch((err) => console.error('Failed to fetch students:', err))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchStudents(ordering);
	}, [ordering]);

	const isInitialLoad = loading && students.length === 0;

	const filtered = search.trim()
		? students.filter((s) => s.name.includes(search.trim()))
		: students;
	const studentsActive = filtered.filter((s) => s.is_active);
	const studentsInactive = filtered.filter((s) => !s.is_active);

	const StudentCard = ({ student }: { student: Student }) => (
		<div
			className="block cursor-pointer"
			onClick={() => navigate(`/stats/${student.id}`)}
		>
			<Card>
				<CardHeader>
					<CardTitle>{student.name}</CardTitle>
					<CardDescription>{convertGrade(student.grade)}</CardDescription>
					<CardAction>
						<ChevronRightIcon />
					</CardAction>
				</CardHeader>
			</Card>
		</div>
	);

	return (
		<div className="pt-16">
			<TopBar title="학습 통계" />
			<PullToRefreshIndicator refreshState={refreshState} pullDistance={pullDistance} />

			<div className="p-4 space-y-3">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
					개인 통계
				</h3>

				<div className="flex gap-4 items-center">
					<Button
						variant={ordering === 'name' || ordering === '-name' ? 'default' : 'outline'}
						onClick={() => {
							if (ordering === 'name') setOrdering('-name');
							else if (ordering === '-name') setOrdering('name');
							else setOrdering('name');
						}}
					>
						이름순
						{ordering === 'name' && <ArrowUpIcon className="size-3.5" />}
						{ordering === '-name' && <ArrowDownIcon className="size-3.5" />}
					</Button>
					<Button
						variant={ordering === 'admission_date' || ordering === '-admission_date' ? 'default' : 'outline'}
						onClick={() => {
							if (ordering === '-admission_date') setOrdering('admission_date');
							else if (ordering === 'admission_date') setOrdering('-admission_date');
							else setOrdering('-admission_date');
						}}
					>
						학년순
						{ordering === '-admission_date' && <ArrowUpIcon className="size-3.5" />}
						{ordering === 'admission_date' && <ArrowDownIcon className="size-3.5" />}
					</Button>
				</div>

				<div className="relative">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						placeholder="이름으로 검색"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>

				<Accordion
					type="single"
					collapsible
					defaultValue="students-active"
				>
					<AccordionItem value="students-active">
						<AccordionTrigger>활성 아동</AccordionTrigger>
						<AccordionContent className="space-y-3">
							{isInitialLoad
								? Array.from({ length: 4 }, (_, i) => (
										<Card key={i}>
											<CardHeader>
												<Skeleton className="h-5 w-20" />
												<Skeleton className="h-4 w-32" />
											</CardHeader>
										</Card>
									))
								: studentsActive.map((student) => (
										<StudentCard key={student.id} student={student} />
									))}
							{!isInitialLoad && studentsActive.length === 0 && (
								<div className="text-center text-muted-foreground">
									활성 아동이 없습니다
								</div>
							)}
						</AccordionContent>
					</AccordionItem>

					<AccordionItem value="students-inactive">
						<AccordionTrigger>보관된 아동</AccordionTrigger>
						<AccordionContent className="space-y-3">
							{studentsInactive.map((student) => (
								<StudentCard key={student.id} student={student} />
							))}
							{studentsInactive.length === 0 && (
								<div className="text-center text-muted-foreground">
									보관된 아동이 없습니다
								</div>
							)}
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</div>
	);
}
