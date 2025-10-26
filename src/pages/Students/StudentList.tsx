// src/pages/Students/StudentList.tsx
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import TopBar from '@/components/layout/TopBar';
import { students } from '@/lib/dummyData';

export default function StudentList() {
	return (
		<div className="pb-16">
			<TopBar title="Students" />
			<div className="p-4 space-y-3">
				{students.map((student) => (
					<Card className="hover:bg-accent transition-colors">
						<CardContent className="p-4">
							<Link
								key={student.id}
								to={`/student/${student.id}`}
							>
								<p className="text-base font-medium">{student.name}</p>
							</Link>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
