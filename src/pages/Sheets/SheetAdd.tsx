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

const formSchema = z.object({
	isbn: z.string().regex(/(97889|97911)\d{8}/, '잘못된 ISBN입니다!'),
});

export function SheetAdd() {
	const { studentId } = useParams();
	const [textBook, setTextBook] = useState<TextBook | null>(null);
	const [loading, setLoading] = useState(true);

	// Use zod form for validation
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	// Function to run after submission
	function handleSubmit() {
		const payload = {
			isbn: textBook?.isbn,
			student: studentId,
		};

		console.log(payload);
	}

	// Function to search book from isbn input
	async function handleSearch() {
		const isbn = form.getValues('isbn');
		if (!isbn) return;

		api
			.get(`/zindo/textbooks/search?isbn=${isbn}`)
			.then((res) => setTextBook(res.data))
			.catch((err) => console.error('Failed to search book:', err))
			.finally(() => setLoading(false));

		setLoading(true);
	}

	return (
		<div className="pt-16">
			<TopBar title="새로운 교재" />

			<div className="p-4 space-y-4">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
					새 기록지 추가
				</h3>
				<p>새 기록지를 추가합니다.</p>

				{loading ? (
					<Card>
						<CardHeader>
							<CardTitle>교재 검색</CardTitle>
							<CardDescription>
								책 뒷면의 바코드로 교재를 검색할 수 있습니다.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<img src={isbn_sample}></img>
							<form>
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
													/>
													<InputGroupAddon align="inline-end">
														<InputGroupButton
															variant="secondary"
															onClick={handleSearch}
														>
															검색
														</InputGroupButton>
													</InputGroupAddon>
												</InputGroup>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									></Controller>
								</FieldGroup>
							</form>
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardHeader>
							<CardTitle>검색 결과</CardTitle>
							<CardDescription></CardDescription>
						</CardHeader>
						<CardContent>
							<img
								src={textBook?.image}
								alt="Book Cover"
							/>

							<div className="py-3">
								{textBook?.name}
								<Separator />
								{textBook?.subject} | ISBN {textBook?.isbn}
							</div>
						</CardContent>
						<CardFooter>
							<div className="space-x-3">
								<Button
									type="submit"
									onClick={handleSubmit}
								>
									기록지에 추가
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										setTextBook(null);
										setLoading(true);
									}}
								>
									다시 검색
								</Button>
							</div>
						</CardFooter>
					</Card>
				)}
			</div>
		</div>
	);
}
