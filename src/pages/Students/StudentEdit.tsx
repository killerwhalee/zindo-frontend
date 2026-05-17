import { useNavigate, useParams } from 'react-router-dom';
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
import type { Student } from '@/components/types';
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
	grade: z.number().int().min(1).max(12),
});

// Every student's admission date is March 1st.
// Grade G was admitted on March 1 of (academic_year - G + 1),
// where academic_year is the current calendar year if today >= March 1, else previous year.
function gradeToAdmissionDate(grade: number): string {
	const today = new Date();
	const academicYear =
		today.getMonth() >= 2 ? today.getFullYear() : today.getFullYear() - 1;
	return `${academicYear - grade + 1}-03-01`;
}

// Outer component: fetches student, shows Loading until ready
export default function StudentEdit() {
	const { studentId } = useParams();
	const [student, setStudent] = useState<Student>();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.get<Student>(`/zindo/students/${studentId}/`)
			.then((res) => setStudent(res.data))
			.catch((err) => console.error('Failed to load data:', err))
			.finally(() => setLoading(false));
	}, [studentId]);

	if (loading || !student) return <Loading />;

	return (
		<StudentEditForm
			student={student}
			studentId={studentId!}
		/>
	);
}

// Inner component: only mounts after student is ready, so defaultValues are correct
function StudentEditForm({
	student,
	studentId,
}: {
	student: Student;
	studentId: string;
}) {
	const navigate = useNavigate();

	const [openPatch, setOpenPatch] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: student.name,
			grade: student.grade,
		},
	});

	async function editStudent(data: z.infer<typeof formSchema>) {
		try {
			await api.patch(`/zindo/students/${studentId}/`, {
				name: data.name,
				admission_date: gradeToAdmissionDate(data.grade),
			});
			setIsSuccess(true);
		} catch (err) {
			console.error('Failed to patch data:', err);
			setIsSuccess(false);
		} finally {
			setOpenPatch(true);
		}
	}

	async function deleteStudent() {
		try {
			await api.delete(`/zindo/students/${studentId}/`);
			setIsSuccess(true);
		} catch (err) {
			console.error('Failed to delete data:', err);
			setIsSuccess(false);
		} finally {
			setOpenDelete(true);
		}
	}

	return (
		<div className="pt-16">
			<TopBar title="학생 정보 수정" />

			<div className="p-4 space-y-4">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
					아동 정보 수정
				</h3>
				<p>아동의 이름과 학년을 수정합니다.</p>

				<form
					id="student-edit-form"
					onSubmit={form.handleSubmit(editStudent)}
				>
					<FieldGroup>
						<Controller
							name="name"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field>
									<FieldLabel htmlFor="student-edit-form-name">이름</FieldLabel>
									<Input
										{...field}
										id="student-edit-form-name"
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
										value={String(field.value)}
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
										학생 삭제
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>학생 삭제 💥</DialogTitle>
									</DialogHeader>
									<p className="text-center">
										학생을 삭제하시겠습니까? <br />
										삭제된 학생과 모든 기록은 복구할 수 없습니다!!
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
												onClick={deleteStudent}
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
								<p className="text-center">
									학생 정보가 성공적으로 수정되었습니다.
								</p>
								<DialogFooter>
									<Button
										onClick={() => {
											setOpenPatch(false);
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
									학생 정보 수정에 실패했습니다. <br />
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
								<p className="text-center">학생이 성공적으로 삭제되었습니다.</p>
								<DialogFooter>
									<Button
										onClick={() => {
											setOpenDelete(false);
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
									학생 삭제에 실패했습니다. <br />
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
