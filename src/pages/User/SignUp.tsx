import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

const formSchema = z
	.object({
		name: z.string().min(1, '이름을 입력하세요.'),
		email: z.email('올바른 이메일 주소를 입력하세요.'),
		password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
		password_confirm: z.string().min(1, '비밀번호 확인을 입력하세요.'),
	})
	.refine((d) => d.password === d.password_confirm, {
		message: '비밀번호가 일치하지 않습니다.',
		path: ['password_confirm'],
	});

type FormValues = z.infer<typeof formSchema>;

export default function SignUp() {
	const navigate = useNavigate();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			email: '',
			password: '',
			password_confirm: '',
		},
	});

	async function onSubmit(data: FormValues) {
		try {
			await api.post('/user/auth/signup/', data);
			toast.success('인증 메일이 발송되었습니다. 이메일을 확인해주세요.');
			navigate('/user/signin');
		} catch (err) {
			if (isAxiosError(err) && err.response?.data) {
				const errors = err.response.data;
				const first = Object.values(errors).flat()[0];
				toast.error(typeof first === 'string' ? first : '회원가입에 실패했습니다.');
			} else {
				toast.error('회원가입에 실패했습니다.');
			}
		}
	}

	return (
		<div className="pt-16 p-4 space-y-4">
			<div className="mb-10">
				<h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
					zindo
				</h1>
				<h2 className="text-center text-xl font-bold">
					내 손 안의 학습상황기록지
				</h2>
			</div>

			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-lg">회원가입</CardTitle>
					<CardDescription>zindo의 새 멤버가 되어보세요!</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<FieldGroup className="gap-4">
							<Controller
								name="name"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="signup-name">이름</FieldLabel>
										<Input
											{...field}
											id="signup-name"
											placeholder="홍길동"
											autoComplete="name"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<Controller
								name="email"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="signup-email">이메일</FieldLabel>
										<Input
											{...field}
											type="email"
											id="signup-email"
											placeholder="email@example.com"
											autoComplete="email"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<Controller
								name="password"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="signup-password">
											비밀번호
										</FieldLabel>
										<Input
											{...field}
											type="password"
											id="signup-password"
											placeholder="8자 이상"
											autoComplete="new-password"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<Controller
								name="password_confirm"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="signup-password-confirm">
											비밀번호 확인
										</FieldLabel>
										<Input
											{...field}
											type="password"
											id="signup-password-confirm"
											placeholder="비밀번호 확인"
											autoComplete="new-password"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<Field>
								<Button
									type="submit"
									className="w-full"
									disabled={form.formState.isSubmitting}
								>
									회원가입
								</Button>
								<FieldDescription className="text-center">
									이미 계정이 있나요?{' '}
									<Link to="/user/signin">로그인</Link>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>

			<div className="my-10">
				<p className="text-center text-xs text-muted-foreground">
					© {new Date().getFullYear()} Chaemin Lim.
				</p>
			</div>
		</div>
	);
}
