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

export default function StudentList() {
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.get('/zindo/students/')
			.then((res) => setStudents(res.data))
			.catch((err) => console.error('Failed to fetch students:', err))
			.finally(() => setLoading(false));
	}, []);

	if (loading) return <Loading />;

	return (
		<div className="pt-16">
			<TopBar title="아동 목록" />
			<div className="p-4 space-y-3">
				{students.map((student) => (
					<Card
						key={student.id}
						className="w-full max-w-sm"
					>
						<CardHeader>
							<CardTitle>{student.name}</CardTitle>
							<CardDescription>{student.grade}학년</CardDescription>
							<CardAction>
								<Link
									to={`/student/${student.id}`}
								>
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
