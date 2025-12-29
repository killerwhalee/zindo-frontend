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
import { useEffect, useState } from 'react';
import type { Record } from '@/components/types';
import api from '@/lib/api';
import Loading from '@/components/layout/Loading';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';

const formSchema = z.object({
	date: z.date(),
	start: z
		.number('숫자를 입력하세요!')
		.min(0, '페이지 수는 0보다 커야 합니다!!'),
	end: z.number('숫자를 입력하세요!').min(0, '페이지 수는 0보다 커야 합니다!!'),
	note: z.string().optional(),
});

export default function RecordEdit() {
	// Get query params
	const { recordId } = useParams();

	// State for record fetching
	const [record, setRecord] = useState<Record>();
	const [loading, setLoading] = useState(true);

	// State for calendar popover
	const [openCalendar, setOpenCalendar] = useState(false);

	// State for dialog
	const [openPatch, setOpenPatch] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	// Use zod form for validation
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	/**
	 * Function to run after submission
	 */
	async function editRecord(data: z.infer<typeof formSchema>) {
		try {
			await api.patch(`/zindo/records/${recordId}/`, {
				created_at: data.date,
				progress: {
					type: 'range',
					start: data.start,
					end: data.end,
				},
				note: data.note,
			});
			setIsSuccess(true);
		} catch (err) {
			console.error('Failed to patch data:', err);
			setIsSuccess(false);
		} finally {
			setOpenPatch(true);
		}
	}

	/**
	 * Function to run after pressing delete button
	 */
	async function deleteRecord() {
		try {
			await api.delete(`/zindo/records/${recordId}/`);
			setIsSuccess(true);
		} catch (err) {
			console.error('Failed to delete data:', err);
			setIsSuccess(false);
		} finally {
			setOpenDelete(true);
		}
	}

	// Fetch records from given sheet, and take latest one.
	useEffect(() => {
		api
			.get<Record>(`/zindo/records/${recordId}/`)
			.then((res) => setRecord(res.data))
			.catch((err) => console.error('Failed to load data:', err))
			.finally(() => setLoading(false));
	}, [recordId]);

	// Fill record data into form.
	useEffect(() => {
		if (record) {
			form.reset({
				date: new Date(record?.created_at),
				start: record?.progress.start,
				end: record?.progress.end,
				note: record?.note ?? undefined,
			});
		}
	}, [form, record]);

	if (loading) return <Loading />;

	return (
		<div className="pt-16">
			<TopBar title="새 학습 기록" />

			<div className="p-4 space-y-4">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
					학습 기록 수정
				</h3>
				<p>작성된 학습상황기록을 수정합니다.</p>

				<form
					id="record-write-form"
					onSubmit={form.handleSubmit(editRecord)}
				>
					<FieldGroup>
						<Controller
							name="date"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field>
									<FieldLabel htmlFor="record-write-form-date">
										학습일
									</FieldLabel>
									<Popover
										open={openCalendar}
										onOpenChange={setOpenCalendar}
									>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												id="record-write-form-date"
												className="w-full justify-between"
											>
												{field.value
													? field.value.toLocaleDateString()
													: '날짜 선택'}
												<CalendarIcon className="ml-2 h-4 w-4" />
											</Button>
										</PopoverTrigger>
										<PopoverContent
											className="w-auto overflow-hidden p-0"
											align="start"
										>
											<Calendar
												mode="single"
												selected={field.value}
												onSelect={(selectedDate) => {
													if (!selectedDate) return;

													const now = new Date();
													const updatedDate = new Date(selectedDate);

													updatedDate.setHours(
														now.getHours(),
														now.getMinutes(),
														now.getSeconds(),
														now.getMilliseconds()
													);

													field.onChange(updatedDate);
													setOpenCalendar(false);
												}}
											/>
										</PopoverContent>
									</Popover>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

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
											placeholder={String(record?.progress.start ?? undefined)}
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
							/>

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
											placeholder={String(record?.progress.end ?? undefined)}
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
							/>
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
						/>

						<div className="grid grid-cols-2 gap-4">
							<Field>
								<Button
									type="submit"
									className="w-full"
								>
									수정 완료
								</Button>
							</Field>
							<Dialog>
								<DialogTrigger asChild>
									<Button
										type="button"
										variant="destructive"
										className="w-full"
									>
										기록 삭제
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>기록 삭제 💥</DialogTitle>
									</DialogHeader>

									<p className="text-center">
										기록을 삭제하시겠습니까? <br />
										삭제된 기록은 복구할 수 없습니다!!
									</p>
									<DialogFooter>
										<div className="grid grid-cols-2 gap-4">
											<DialogClose>
												<Button
													variant="secondary"
													className="w-full"
												>
													취소
												</Button>
											</DialogClose>
											<Button
												variant="destructive"
												onClick={deleteRecord}
											>
												삭제
											</Button>
										</div>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</FieldGroup>
				</form>

				{/* dialog after patch */}
				<Dialog
					open={openPatch}
					onOpenChange={setOpenPatch}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{isSuccess ? '수정 완료 🥳' : '수정 실패 🥺'}
							</DialogTitle>
						</DialogHeader>

						{isSuccess ? (
							<div className="space-y-3">
								<p className="text-center">기록이 성공적으로 수정되었습니다.</p>
								<DialogFooter>
									<Button
										onClick={() => {
											setOpenPatch(false);
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
									기록 수정에 실패했습니다. <br />
									잠시 후 다시 시도해 주세요.
								</p>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setOpenPatch(false)}
									>
										닫기
									</Button>
								</DialogFooter>
							</div>
						)}
					</DialogContent>
				</Dialog>

				{/* dialog after delete */}
				<Dialog
					open={openDelete}
					onOpenChange={setOpenDelete}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{isSuccess ? '삭제 완료 🥳' : '삭제 실패 🥺'}
							</DialogTitle>
						</DialogHeader>

						{isSuccess ? (
							<div className="space-y-3">
								<p className="text-center">기록이 성공적으로 삭제되었습니다.</p>
								<DialogFooter>
									<Button
										onClick={() => {
											setOpenDelete(false);
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
									기록 삭제에 실패했습니다. <br />
									잠시 후 다시 시도해 주세요.
								</p>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setOpenDelete(false)}
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
