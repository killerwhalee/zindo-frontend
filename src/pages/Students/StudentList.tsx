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

type Ordering = 'name' | '-admission_date';

export default function StudentList() {
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

	if (loading) return <Loading />;

	return (
		<div className="pt-16">
			<TopBar title="아동 목록" />

			<div className="p-4 space-y-3">
				{/* Filter Buttons */}
				<div className="flex gap-4">
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
				</div>

				{/* Student Cards */}
				{students.map((student) => (
					<Card
						key={student.id}
						className="w-full max-w-sm"
					>
						<CardHeader>
							<CardTitle>{student.name}</CardTitle>
							<CardDescription>
								{student.grade}학년 |{' '}
								<span
									className={
										student.count_on_progress > student.count_recorded
											? 'text-orange-400'
											: 'text-blue-400'
									}
								>
									오늘 {student.count_on_progress}개 중 {student.count_recorded}개
									완료
								</span>
							</CardDescription>
							<CardAction>
								<Link to={`/student/${student.id}`}>
									<Button type="button">이동</Button>
								</Link>
							</CardAction>
						</CardHeader>
					</Card>
				))}
			</div>
		</div>
	);
}
