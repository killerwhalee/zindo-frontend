// src/pages/Records/RecordList.tsx
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TopBar from '@/components/layout/TopBar';
import { records, subjects } from '@/lib/dummyData';

export default function RecordList() {
	const { subjectId, studentId } = useParams();
	const recordList = records[Number(subjectId)] || [];
	const subjectName =
		Object.values(subjects)
			.flat()
			.find((s) => s.id === Number(subjectId))?.name || 'Subject';

	return (
		<div className="pb-16">
			<TopBar title={`${subjectName} Records`} />

			<div className="p-4 space-y-3">
				{recordList.map((rec) => (
					<Card key={rec.id}>
						<CardContent className="p-3 space-y-1">
							<p className="text-sm text-muted-foreground">{rec.date}</p>
							<p>{rec.text}</p>
						</CardContent>
					</Card>
				))}
			</div>

			<Button
				variant="outline"
				className="fixed bottom-20 right-5"
			>
				<Link to={`/student/${studentId}/subject/${subjectId}/new`}>
					New Record
				</Link>
			</Button>
		</div>
	);
}
