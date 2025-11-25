import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Controller, useForm } from 'react-hook-form';

import isbnSample from '@/assets/isbn-sample.png';
import type { TextBook } from '@/components/types';
import api from '@/lib/api';

// ui components
import { Button } from '@/components/ui/button';
import TopBar from '@/components/layout/TopBar';
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const searchSchema = z.object({
	mode: z.literal('search'),
	isbn: z.string().regex(/(97889|97911)\d{8}$/, '잘못된 ISBN입니다!'),
	name: z.string().optional(),
	subject: z.string().optional(),
	image: z.string().optional(),
});

const manualSchema = z.object({
	mode: z.literal('manual'),
	isbn: z.string().optional(),
	name: z.string().min(1, '교재명을 입력해 주세요.'),
	subject: z.string().min(1, '과목을 입력해 주세요.'),
	image: z.string().optional(),
});

const formSchema = z.discriminatedUnion('mode', [searchSchema, manualSchema]);

export default function SheetAdd() {
	// Get query params
	const { studentId } = useParams();

	// State for textbook search
	const [manualMode, setManualMode] = useState(false);
	const [notFound, setNotFound] = useState(false);
	const [textBook, setTextBook] = useState<TextBook | null>(null);

	// State for dialog
	const [open, setOpen] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	// Use zod form for validation
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		mode: 'onChange',
		defaultValues: {
			mode: 'search',
			isbn: '',
			name: '',
			subject: '',
			image: '',
		},
	});
	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			if (manualMode) {
				// manual submission
				await api.post('/zindo/sheets/', {
					student: studentId,
					name: values.name,
					subject: values.subject,
				});
			} else {
				// isbn search submission
				await api.post('/zindo/sheets/', {
					student: studentId,
					isbn: values.isbn,
				});
			}

			setIsSuccess(true);
		} catch (err) {
			console.error('Failed to post data:', err);
			setIsSuccess(false);
		} finally {
			setOpen(true);
		}
	}

	async function handleSearch() {
		const isbn = form.getValues('isbn');
		if (!isbn) return;

		setTextBook(null);
		setNotFound(false);

		try {
			const res = await api.get(`/zindo/textbooks/search?isbn=${isbn}`);
			const data = res.data;

			if (!data || Object.keys(data).length === 0) {
				setNotFound(true);
			} else {
				setTextBook(data);
			}
		} catch (err) {
			console.error('Failed to search book:', err);
		}
	}

	return (
		<div className="pt-16">
			<TopBar title="새로운 교재" />

			<div className="p-4 space-y-4">
				<h3 className="text-2xl font-semibold">새 기록지 추가</h3>
				<p>새 기록지를 추가합니다.</p>

				<form onSubmit={form.handleSubmit(onSubmit)}>
					<Card>
						<CardHeader>
							{!manualMode ? (
								<>
									<CardTitle>교재 검색</CardTitle>
									<CardDescription>ISBN으로 교재를 검색합니다.</CardDescription>
								</>
							) : (
								<>
									<CardTitle>수동 입력 모드</CardTitle>
									<CardDescription>
										ISBN이 없는 경우 교재 정보를 직접 입력합니다.
									</CardDescription>
								</>
							)}
						</CardHeader>

						<CardContent>
							{/* isbn search mode */}
							{!manualMode && !textBook && (
								<>
									<img
										src={isbnSample}
										alt="isbn sample"
									/>

									<FieldGroup>
										<Field>
											<FieldLabel>
												ISBN <span className="underline">13자리 숫자</span>를
												입력하세요.
											</FieldLabel>
											<Controller
												name="isbn"
												control={form.control}
												render={({ field, fieldState }) => (
													<>
														<InputGroup>
															<InputGroupInput
																{...field}
																className="text-sm"
																placeholder="9788940803561"
																onChange={(e) => {
																	field.onChange(e);
																	form.trigger('isbn');
																	setNotFound(false);
																}}
																onKeyDown={(e) => {
																	if (e.key === 'Enter') {
																		e.preventDefault();
																		handleSearch();
																	}
																}}
															/>

															<InputGroupAddon align="inline-end">
																<InputGroupButton
																	type="button"
																	variant="secondary"
																	onClick={handleSearch}
																	disabled={
																		fieldState.invalid ||
																		!form.getValues('isbn')
																	}
																>
																	검색
																</InputGroupButton>
															</InputGroupAddon>
														</InputGroup>

														{fieldState.error && (
															<FieldError errors={[fieldState.error]} />
														)}
														{notFound && (
															<FieldError>검색 결과가 없습니다.</FieldError>
														)}
													</>
												)}
											/>
										</Field>
									</FieldGroup>
								</>
							)}

							{/* isbn search result */}
							{!manualMode && textBook && (
								<>
									<img
										src={textBook.image}
										alt="Book Cover"
									/>

									<div className="py-3">
										{textBook.name}
										<Separator />
										{textBook.subject} | ISBN {textBook.isbn}
									</div>
								</>
							)}

							{/* manual mode */}
							{manualMode && (
								<div className="space-y-4">
									<FieldGroup>
										<Field>
											<FieldLabel>교재명</FieldLabel>
											<Controller
												name="name"
												control={form.control}
												render={({ field }) => (
													<InputGroup>
														<InputGroupInput
															{...field}
															className="text-sm"
															placeholder="디딤돌 초등 수학 1-3 기본편"
														/>
													</InputGroup>
												)}
											/>
										</Field>

										<Field>
											<FieldLabel>과목</FieldLabel>
											<Controller
												name="subject"
												control={form.control}
												render={({ field }) => (
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="과목을 선택하세요" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="국어">국어</SelectItem>
															<SelectItem value="수학">수학</SelectItem>
															<SelectItem value="영어">영어</SelectItem>
															<SelectItem value="과학">과학</SelectItem>
															<SelectItem value="기타">기타</SelectItem>
														</SelectContent>
													</Select>
												)}
											/>
										</Field>
									</FieldGroup>
								</div>
							)}
						</CardContent>

						<CardFooter>
							<div className="space-y-2 w-full ">
								{/* isbn search mode */}
								{!manualMode && !textBook && (
									<>
										<div className="my-4 space-y-2">
											<p className="text-sm text-muted-foreground">
												교재에 ISBN이 없나요?
											</p>
											<Button
												type="button"
												variant="outline"
												className="w-full"
												onClick={() => {
													setManualMode(true);
													form.setValue('mode', 'manual');
												}}
											>
												ISBN 없이 직접 입력하기
											</Button>
										</div>
									</>
								)}

								{/* isbn search result */}
								{!manualMode && textBook && (
									<>
										<div className="my-4 space-y-2">
											<p className="text-sm text-muted-foreground">
												찾는 교재가 아닌가요?
											</p>
											<Button
												variant="outline"
												type="button"
												className="w-full"
												onClick={() => setTextBook(null)}
											>
												다시 검색
											</Button>
										</div>

										<Button
											type="submit"
											className="w-full"
										>
											추가하기!
										</Button>
									</>
								)}

								{/* manual mode */}
								{manualMode && (
									<>
										<div className="my-4 space-y-2">
											<p className="text-sm text-muted-foreground">
												다시 보니 교재에 ISBN이 있었나요?
											</p>
											<Button
												type="button"
												variant="outline"
												className="w-full"
												onClick={() => {
													setManualMode(false);
													form.setValue('mode', 'search');
												}}
											>
												ISBN 검색 모드로 돌아가기
											</Button>
										</div>

										<Button
											type="submit"
											className="w-full"
											disabled={!form.formState.isValid}
										>
											추가하기!
										</Button>
									</>
								)}
							</div>
						</CardFooter>
					</Card>
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
								<p className="text-center">
									기록지가 성공적으로 추가되었습니다.
								</p>
								<DialogFooter>
									<Button
										onClick={() => {
											setOpen(false);
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
									기록지 등록에 실패했습니다.
									<br />
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
