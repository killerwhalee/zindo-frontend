import { Link, useParams } from 'react-router-dom';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import TopBar from '@/components/layout/TopBar';
import type { Student, Record, Sheet } from '@/components/types';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Loading from '@/components/layout/Loading';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { CheckIcon } from 'lucide-react';

export default function RecordList() {
	const { studentId, sheetId } = useParams();

	const [student, setStudent] = useState<Student | null>(null);
	const [sheet, setSheet] = useState<Sheet | null>(null);
	const [records, setRecords] = useState<Record[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchData() {
			try {
				const [studentRes, sheetRes, recordRes] = await Promise.all([
					api.get<Student>('/zindo/students/' + studentId),
					api.get<Sheet>('/zindo/sheets/' + sheetId),
					api.get<Record[]>('/zindo/records?sheet__id=' + sheetId),
				]);

				setStudent(studentRes.data);
				setSheet(sheetRes.data);
				setRecords(recordRes.data);
			} catch (err) {
				console.error('Failed to load data:', err);
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [studentId, sheetId]);

	if (loading) return <Loading />;

	return (
		<div className="pt-16">
			<TopBar title={`학습상황기록 - ${student?.name}`} />

			<div className="p-4 space-y-3">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
					{sheet?.textbook_detail.name}
				</h3>
				<p>
					일일 권장 학습량:{' '}
					{sheet?.pace ? `${sheet.pace}페이지` : '지정되지 않음'}
				</p>

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>날짜</TableHead>
							<TableHead>진도상황</TableHead>
							<TableHead>특이사항</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{records.map((record) => (
							<TableRow>
								<TableCell className="font-medium">
									{record.created_at.slice(0, 10)}
								</TableCell>
								<TableCell>
									{record.progress.start}p ~ {record.progress.end}p
								</TableCell>
								<TableCell className="whitespace-normal break-words align-top">
									{record.note}
								</TableCell>
							</TableRow>
						))}
						{records.length === 0 && (
							<TableRow>
								<TableCell
									className="text-center"
									colSpan={3}
								>
									작성된 기록이 아직 없습니다 🥺
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>

				{/* display button only if sheet is not finished */}
				{sheet?.is_finished ? (
					<Alert>
						<CheckIcon />
						<AlertTitle>완료된 기록지입니다.</AlertTitle>
					</Alert>
				) : (
					<Button className="w-full">
						<Link to={`/student/${student?.id}/sheet/${sheet?.id}/new`}>
							새 기록 작성
						</Link>
					</Button>
				)}
			</div>
		</div>
	);
}
