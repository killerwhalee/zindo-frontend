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
import { Separator } from '@/components/ui/separator';
import Loading from '@/components/layout/Loading';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';

export default function SheetList() {
	const { studentId } = useParams();

	const [student, setStudent] = useState<Student | null>(null);
	const [sheets, setSheets] = useState<Sheet[]>([]);
	const [loading, setLoading] = useState(true);

	// fetch data from api
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
	}, [studentId]);

	// filter sheets by `is_finished` field
	const sheetsOngoing = sheets.filter((sheet) => !sheet.is_finished);
	const sheetsFinished = sheets.filter((sheet) => sheet.is_finished);

	if (loading) return <Loading />;

	return (
		<div className="pt-16">
			<TopBar title={`학습상황기록 - ${student?.name}`} />
			<div className="p-4 space-y-3">
				<Accordion
					type="single"
					collapsible
					defaultValue="sheets-ongoing"
				>
					<AccordionItem value="sheets-ongoing">
						<AccordionTrigger>진행 중인 교재</AccordionTrigger>
						<AccordionContent className="space-y-3">
							{sheetsOngoing.map((sheet) => (
								<Card className="max-w-lg py-0 flex-row gap-0">
									<div className="min-w-54">
										<CardHeader className="pt-6">
											<CardTitle>{sheet.textbook_detail.name}</CardTitle>
											<CardDescription>
												{sheet.textbook_detail.subject}
											</CardDescription>
										</CardHeader>
										<CardFooter className="gap-3 py-6">
											<Button>
												<Link
													key={sheet.id}
													to={`/student/${student?.id}/sheet/${sheet.id}`}
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
							))}
							{sheetsOngoing.length === 0 && (
								<div className="text-center">
									현재 진행 중인 교재가 없습니다 🥺
								</div>
							)}
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="sheets-finished">
						<AccordionTrigger>완료된 교재</AccordionTrigger>
						<AccordionContent className="space-y-3">
							{sheetsFinished.map((sheet) => (
								<Card className="max-w-lg py-0 flex-row gap-0">
									<div className="min-w-54">
										<CardHeader className="pt-6">
											<CardTitle>{sheet.textbook_detail.name}</CardTitle>
											<CardDescription>
												{sheet.textbook_detail.subject}
												<Separator />
												ISBN {sheet.textbook_detail.isbn}
											</CardDescription>
										</CardHeader>
										<CardFooter className="gap-3 py-6">
											<Button>
												<Link
													key={sheet.id}
													to={`/student/${student?.id}/sheet/${sheet.id}`}
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
							))}
							{sheetsFinished.length === 0 && (
								<div className="text-center">
									완료된 교재가 아직 없습니다 🥺
								</div>
							)}
						</AccordionContent>
					</AccordionItem>
				</Accordion>

				<Button className="w-full">
					<Link to={`/student/${student?.id}/new`}>새 교재 추가</Link>
				</Button>
			</div>
		</div>
	);
}
