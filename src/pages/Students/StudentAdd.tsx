import { useNavigate } from 'react-router-dom';
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
import { useState } from 'react';
import api from '@/lib/api';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { convertGrade } from '@/lib/utils';

const formSchema = z.object({
	name: z
		.string()
		.min(1, '이름을 입력해 주세요.')
		.max(8, '이름은 8자 이하여야 합니다.'),
	grade: z.number('학년을 선택해 주세요.').int().min(1).max(12),
});

function gradeToAdmissionDate(grade: number): string {
	const today = new Date();
	const academicYear =
		today.getMonth() >= 2 ? today.getFullYear() : today.getFullYear() - 1;
	return `${academicYear - grade + 1}-03-01`;
}

export default function StudentAdd() {
	const navigate = useNavigate();

	const [openResult, setOpenResult] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: { name: '' },
	});

	async function addStudent(data: z.infer<typeof formSchema>) {
		try {
			await api.post('/zindo/students/', {
				name: data.name,
				admission_date: gradeToAdmissionDate(data.grade),
			});
			setIsSuccess(true);
		} catch (err) {
			console.error('Failed to post data:', err);
			setIsSuccess(false);
		} finally {
			setOpenResult(true);
		}
	}

	return (
		<div className="pt-16">
			<TopBar title="신규 아동 추가" />

			<div className="p-4 space-y-4">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
					신규 아동 추가
				</h3>
				<p>새 아동의 이름과 학년을 입력합니다.</p>

				<form
					id="student-add-form"
					onSubmit={form.handleSubmit(addStudent)}
				>
					<FieldGroup>
						<Controller
							name="name"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field>
									<FieldLabel htmlFor="student-add-form-name">이름</FieldLabel>
									<Input
										{...field}
										id="student-add-form-name"
										placeholder="홍길동"
										autoComplete="off"
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						<Controller
							name="grade"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field>
									<FieldLabel>학년</FieldLabel>
									<Select
										value={field.value != null ? String(field.value) : ''}
										onValueChange={(v) => field.onChange(parseInt(v, 10))}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="학년을 선택하세요" />
										</SelectTrigger>
										<SelectContent>
											{Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
												<SelectItem
													key={g}
													value={String(g)}
												>
													{convertGrade(g)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						<Button
							type="submit"
							className="w-full"
						>
							추가하기
						</Button>
					</FieldGroup>
				</form>

				<Dialog
					open={openResult}
					onOpenChange={setOpenResult}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{isSuccess ? '등록 완료 🥳' : '등록 실패 🥺'}
							</DialogTitle>
						</DialogHeader>

						{isSuccess ? (
							<div className="space-y-3">
								<p className="text-center">아동이 성공적으로 추가되었습니다.</p>
								<DialogFooter>
									<Button
										onClick={() => {
											setOpenResult(false);
											navigate('/student');
										}}
									>
										목록으로 돌아가기
									</Button>
								</DialogFooter>
							</div>
						) : (
							<div className="space-y-3">
								<p className="text-center">
									아동 추가에 실패했습니다. <br />
									잠시 후 다시 시도해 주세요.
								</p>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setOpenResult(false)}
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
