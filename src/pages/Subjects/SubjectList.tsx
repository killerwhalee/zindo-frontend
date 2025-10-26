// src/pages/Subjects/SubjectList.tsx
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import TopBar from '@/components/layout/TopBar';
import { subjects, students } from '@/lib/dummyData';

export default function SubjectList() {
	const { studentId } = useParams();
	const student = students.find((s) => s.id === Number(studentId));
	const subjectList = subjects[Number(studentId)] || [];

	return (
		<div className="pb-16">
			<TopBar title={student ? `${student.name}'s Subjects` : 'Subjects'} />
			<div className="p-4 space-y-3">
				{subjectList.map((subj) => (
					<Card className="hover:bg-accent transition-colors">
						<CardContent className="p-4">
							<Link
								key={subj.id}
								to={`/student/${studentId}/subject/${subj.id}`}
							>
								<p className="text-base font-medium">{subj.name}</p>
							</Link>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
