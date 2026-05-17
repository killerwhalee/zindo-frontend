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
import Loading from '@/components/layout/Loading';
import { ChevronRightIcon, PlusIcon } from 'lucide-react';
import { convertGrade } from '@/lib/utils';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';

type Ordering = 'name' | '-admission_date';

export default function StudentList() {
	// State for API call
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);
	const [ordering, setOrdering] = useState<Ordering>('name');

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

	const studentsActive = students.filter((s) => s.is_active);
	const studentsInactive = students.filter((s) => !s.is_active);

	if (loading) return <Loading />;

	return (
		<div className="pt-16">
			<TopBar title="아동 목록" />

			<div className="p-4 space-y-3">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
					아동 목록
				</h3>

				{/* Filter Buttons */}
				<div className="flex gap-4 items-center">
					<Button
						variant={ordering === 'name' ? 'default' : 'outline'}
						onClick={() => setOrdering('name')}
					>
						이름순
					</Button>
					<Button
						variant={ordering === '-admission_date' ? 'default' : 'outline'}
						onClick={() => setOrdering('-admission_date')}
					>
						학년순
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

				<Accordion
					type="single"
					collapsible
					defaultValue="students-active"
				>
					<AccordionItem value="students-active">
						<AccordionTrigger>활성 아동</AccordionTrigger>
						<AccordionContent className="space-y-3">
							{studentsActive.map((student) => (
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
														student.count_on_progress > student.count_recorded
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
							{studentsActive.length === 0 && (
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
