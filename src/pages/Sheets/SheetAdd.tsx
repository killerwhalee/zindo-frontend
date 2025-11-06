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
import { Controller, useForm } from 'react-hook-form';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group';

import isbn_sample from '@/assets/isbn-sample.png';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { useState } from 'react';
import type { TextBook } from '@/components/types';
import api from '@/lib/api';
import { Separator } from '@/components/ui/separator';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

const formSchema = z.object({
	isbn: z.string().regex(/(97889|97911)\d{8}$/, '잘못된 ISBN입니다!'),
});

export function SheetAdd() {
	// Get query params
	const { studentId } = useParams();

	// State for textbook search
	const [textBook, setTextBook] = useState<TextBook | null>(null);
	const [notFound, setNotFound] = useState(false);

	// State for dialog
	const [open, setOpen] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	// Use zod form for validation
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			isbn: '',
		},
	});

	/**
	 * Function to run after submission
	 */
	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			await api.post('/zindo/sheets/', {
				isbn: values.isbn,
				student: studentId,
			});
			setIsSuccess(true);
		} catch (err) {
			console.error('Failed to post data:', err);
			setIsSuccess(false);
		} finally {
			setOpen(true);
		}
	}

	/**
	 * Function to search book from isbn input
	 */
	async function handleSearch() {
		const isbn = form.getValues('isbn');
		if (!isbn) return;

		setTextBook(null);

		try {
			const res = await api.get(`/zindo/textbooks/search?isbn=${isbn}`);
			const data = res.data;

			if (!data || Object.keys(data).length === 0) {
				setNotFound(true);
			} else {
				setTextBook(res.data);
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
							{!textBook ? (
								<>
									<CardTitle>교재 검색</CardTitle>
									<CardDescription>
										책 뒷면의 바코드로 교재를 검색할 수 있습니다.
									</CardDescription>
								</>
							) : (
								<>
									<CardTitle>교재 검색 결과</CardTitle>
									<CardDescription>교재가 검색되었습니다.</CardDescription>
								</>
							)}
						</CardHeader>
						<CardContent>
							{!textBook ? (
								<>
									<img
										src={isbn_sample}
										alt="isbn sample"
									/>
									<FieldGroup>
										<Controller
											name="isbn"
											control={form.control}
											render={({ field, fieldState }) => (
												<Field>
													<FieldLabel>
														바코드 아래 13자리 숫자를 입력해 주세요.
													</FieldLabel>
													<InputGroup>
														<InputGroupInput
															{...field}
															id="sheet-form-isbn"
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
																	fieldState.invalid || !form.getValues('isbn')
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
												</Field>
											)}
										/>
									</FieldGroup>
								</>
							) : (
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
						</CardContent>

						<CardFooter>
							<div className="space-x-3">
								{textBook && (
									<>
										<Button type="submit">추가하기!</Button>
										<Button
											variant="outline"
											type="button"
											onClick={() => setTextBook(null)}
										>
											다시 검색
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
									기록지 등록에 실패했습니다. <br />
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
