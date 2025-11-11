import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import TopBar from '@/components/layout/TopBar';
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Controller, useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Sheet, Record } from '@/components/types';
import api from '@/lib/api';
import Loading from '@/components/layout/Loading';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

const formSchema = z.object({
	start: z
		.number('숫자를 입력하세요!')
		.min(0, '페이지 수는 0보다 커야 합니다!!'),
	end: z.number('숫자를 입력하세요!').min(0, '페이지 수는 0보다 커야 합니다!!'),
	note: z.string().optional(),
});

export default function RecordAdd() {
	// Get query params
	const { sheetId } = useParams();

	// State for record fetching
	const [sheet, setSheet] = useState<Sheet | null>(null);
	const [record, setRecord] = useState<Record | null>(null);
	const [loading, setLoading] = useState(true);

	// State for dialog
	const [open, setOpen] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	// Use zod form for validation
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	/**
	 * Function to run after submission
	 */
	async function onSubmit(data: z.infer<typeof formSchema>) {
		try {
			await api.post('/zindo/records/', {
				sheet: Number(sheetId),
				progress: {
					type: 'range',
					start: data.start,
					end: data.end,
				},
				note: data.note,
			});
			setIsSuccess(true);
		} catch (err) {
			console.error('Failed to post data:', err);
			setIsSuccess(false);
		} finally {
			setOpen(true);
		}

		console.log('finished!');
	}

	// Fetch data from api
	useEffect(() => {
		async function fetchData() {
			try {
				const [sheetRes, recordsRes] = await Promise.all([
					api.get<Sheet>(`/zindo/sheets/${sheetId}`),
					api.get<Record[]>(`/zindo/records?sheet__id=${sheetId}`),
				]);

				setSheet(sheetRes.data);
				setRecord(recordsRes.data.at(0) ?? null);
			} catch (err) {
				console.error('Failed to load data:', err);
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [sheetId]);

	if (loading) return <Loading />;

	return (
		<div className="pt-16">
			<TopBar title="새 학습 기록" />

			<div className="p-4 space-y-4">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
					새 학습 기록 생성
				</h3>
				<p>새로운 학습상황기록을 작성합니다.</p>

				{record ? (
					<Alert>
						<InfoIcon />
						<AlertTitle>어제의 학습 기록은 다음과 같습니다:</AlertTitle>
						<AlertDescription>
							{record.progress.start}p ~ {record.progress.end}p
						</AlertDescription>
						<AlertDescription>{record.note}</AlertDescription>
					</Alert>
				) : (
					<Alert>
						<InfoIcon />
						<AlertTitle>최근 학습 기록이 없습니다 🥺</AlertTitle>
					</Alert>
				)}

				<form
					id="record-write-form"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-4">
							<Controller
								name="start"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="record-write-form-start">
											시작 페이지
										</FieldLabel>
										<Input
											{...field}
											type="number"
											id="record-write-form-start"
											placeholder={
												record ? String(record.progress.end + 1) : ''
											}
											autoComplete="off"
											onChange={(e) =>
												field.onChange(
													e.target.value === ''
														? undefined
														: Number(e.target.value)
												)
											}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							></Controller>
							<Controller
								name="end"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="record-write-form-end">
											끝 페이지
										</FieldLabel>
										<Input
											{...field}
											type="number"
											id="record-write-form-end"
											placeholder={
												record
													? String(record.progress.end + (sheet?.pace ?? 4))
													: ''
											}
											autoComplete="off"
											onChange={(e) =>
												field.onChange(
													e.target.value === ''
														? undefined
														: Number(e.target.value)
												)
											}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							></Controller>
						</div>

						<Controller
							name="note"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field>
									<FieldLabel htmlFor="record-write-form-note">
										(선택) 오늘의 학습은 어땠나요? <br />
										여기에 작성하시면 다른 선생님께 도움이 될 수 있어요!
									</FieldLabel>
									<Input
										{...field}
										id="record-write-form-note"
										placeholder="예) 세로식 복습이 필요해 보입니다"
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						></Controller>

						<Field>
							<Button
								type="submit"
								className="w-full"
							>
								저장하기
							</Button>
						</Field>
					</FieldGroup>
				</form>

				{/* dialog */}
				<Dialog
					open={open}
					onOpenChange={setOpen}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{isSuccess ? '등록 완료 🥳' : '등록 실패 🥺'}
							</DialogTitle>
						</DialogHeader>

						{isSuccess ? (
							<div className="space-y-3">
								<p className="text-center">기록이 성공적으로 추가되었습니다.</p>
								<DialogFooter>
									<Button
										onClick={() => {
											setOpen(false);
											// Navigate back to the sheet list
											window.history.back();
										}}
									>
										목록으로 돌아가기
									</Button>
								</DialogFooter>
							</div>
						) : (
							<div className="space-y-3">
								<p className="text-center">
									기록 등록에 실패했습니다. <br />
									잠시 후 다시 시도해 주세요.
								</p>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setOpen(false)}
									>
										닫기
									</Button>
								</DialogFooter>
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
