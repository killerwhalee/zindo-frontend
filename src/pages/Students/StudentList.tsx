import { Link } from 'react-router-dom';
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
	PlusIcon,
	RefreshCwIcon,
	SearchIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { convertGrade } from '@/lib/utils';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';

type Ordering = 'name' | '-name' | 'admission_date' | '-admission_date';

export default function StudentList() {
	// State for API call
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);
	const [ordering, setOrdering] = useState<Ordering>('name');
	const [search, setSearch] = useState('');

	const { pulling, refreshing } = usePullToRefresh(() =>
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

	return (
		<div className="pt-16">
			<TopBar title="아동 목록" />
			{(pulling || refreshing) && (
				<div className="flex justify-center py-2">
					<RefreshCwIcon
						className={`size-5 text-muted-foreground${refreshing ? ' animate-spin' : ''}`}
					/>
				</div>
			)}

			<div className="p-4 space-y-3">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
					아동 목록
				</h3>

				{/* Filter Buttons */}
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
					<Link
						to="/student/new"
						className="ml-auto"
					>
						<Button variant="outline">
							아동 추가
							<PlusIcon />
						</Button>
					</Link>
				</div>

				{/* Search */}
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
												<Skeleton className="h-4 w-44" />
											</CardHeader>
										</Card>
									))
								: studentsActive.map((student) => (
										<Link
											to={`/sheet/?studentId=${student.id}`}
											className="block"
											key={student.id}
										>
											<Card>
												<CardHeader>
													<CardTitle>{student.name}</CardTitle>
													<CardDescription>
														{convertGrade(student.grade)} |{' '}
														<span
															className={
																student.count_on_progress >
																student.count_recorded
																	? 'text-orange-400'
																	: 'text-blue-400'
															}
														>
															오늘 {student.count_on_progress}개 중{' '}
															{student.count_recorded}개 완료
														</span>
													</CardDescription>
													<CardAction>
														<ChevronRightIcon />
													</CardAction>
												</CardHeader>
											</Card>
										</Link>
									))}
							{!isInitialLoad && studentsActive.length === 0 && (
								<div className="text-center">활성 아동이 없습니다 🥺</div>
							)}
						</AccordionContent>
					</AccordionItem>

					<AccordionItem value="students-inactive">
						<AccordionTrigger>보관된 아동</AccordionTrigger>
						<AccordionContent className="space-y-3">
							{studentsInactive.map((student) => (
								<Link
									to={`/sheet/?studentId=${student.id}`}
									className="block"
									key={student.id}
								>
									<Card>
										<CardHeader>
											<CardTitle>{student.name}</CardTitle>
											<CardDescription>
												{convertGrade(student.grade)}
											</CardDescription>
											<CardAction>
												<ChevronRightIcon />
											</CardAction>
										</CardHeader>
									</Card>
								</Link>
							))}
							{studentsInactive.length === 0 && (
								<div className="text-center">보관된 아동이 없습니다 🥺</div>
							)}
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</div>
	);
}
