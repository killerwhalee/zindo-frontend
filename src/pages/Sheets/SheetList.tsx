import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import TopBar from '@/components/layout/TopBar';
import { useEffect, useState } from 'react';
import { type Student, type Sheet } from '@/components/types';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Link, useParams } from 'react-router-dom';

export default function SheetList() {
	const { studentId } = useParams();

	const [student, setStudent] = useState<Student | null>(null);
	const [sheets, setSheets] = useState<Sheet[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchData() {
			try {
				const [studentRes, sheetRes] = await Promise.all([
					api.get<Student>('/zindo/students/' + studentId),
					api.get<Sheet[]>('/zindo/sheets?student__id=' + studentId),
				]);

				setStudent(studentRes.data);
				setSheets(sheetRes.data);
			} catch (err) {
				console.error('Failed to load data:', err);
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, []);

	if (loading || !student)
		return <div className="p-4 text-center">Loading...</div>;

	return (
		<div className="pt-16">
			<TopBar title={`학습상황기록 - ${student.name}`} />
			<div className="p-4 space-y-3">
				{sheets.map((sheet) => (
					<Card className="max-w-lg py-0 flex-row gap-0">
						<div className="min-w-54">
							<CardHeader className="pt-6">
								<CardTitle>{sheet.textbook_detail.name}</CardTitle>
								<CardDescription>
									{sheet.textbook_detail.subject} | ISBN{' '}
									{sheet.textbook_detail.isbn}
								</CardDescription>
							</CardHeader>
							<CardFooter className="gap-3 py-6">
								<Button>
									<Link
										key={sheet.id}
										to={`/student/${student.id}/sheet/${sheet.id}`}
									>
										기록지 보기
									</Link>
								</Button>
							</CardFooter>
						</div>
						<CardContent className="grow-1 px-0">
							<img
								src={sheet.textbook_detail.image}
								alt="Book Cover"
								className="size-full rounded-r-xl"
							/>
						</CardContent>
					</Card>
					// <Card className="hover:bg-accent transition-colors">
					// 	<CardHeader>
					// 		<CardTitle>{sheet.textbook_detail.name}</CardTitle>
					// 		<CardDescription>{sheet.textbook_detail.subject}</CardDescription>
					// 		<CardAction>
					// 			<img
					// 				src=
					// 				alt=""
					// 				width={80}
					// 			/>
					// 		</CardAction>
					// 	</CardHeader>
					// 	<CardContent></CardContent>
					// 	<CardFooter>
					// 		<Button className="w-full">
					// 			<Link
					// 				key={sheet.id}
					// 				to={`/student/${student.id}/sheet/${sheet.id}`}
					// 			>
					// 				이동
					// 			</Link>
					// 		</Button>
					// 	</CardFooter>
					// </Card>
				))}
			</div>
		</div>
	);
}
