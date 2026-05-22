import { isAxiosError } from 'axios';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { OctagonXIcon } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { setTokens } from '@/lib/auth';

const formSchema = z.object({
	email: z.email('올바른 이메일 주소를 입력하세요.'),
	password: z.string().min(1, '비밀번호를 입력하세요.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignIn() {
	const navigate = useNavigate();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { email: '', password: '' },
	});

	async function onSubmit(data: FormValues) {
		setErrorMessage(null);
		try {
			const res = await api.post('/user/auth/signin/', {
				email: data.email,
				password: data.password,
			});
			setTokens(res.data.access, res.data.refresh);
			navigate('/');
		} catch (err) {
			if (isAxiosError(err) && err.response?.data?.detail) {
				setErrorMessage(err.response.data.detail);
			} else {
				setErrorMessage('로그인에 실패했습니다.');
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
					<CardTitle className="text-lg">로그인</CardTitle>
					<CardDescription>
						로그인하여 모든 서비스에 접근하세요!
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{errorMessage && (
						<Alert variant="destructive">
							<OctagonXIcon />
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>
					)}

					<form onSubmit={form.handleSubmit(onSubmit)}>
						<FieldGroup className="gap-4">
							<Controller
								name="email"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="signin-email">
											이메일
										</FieldLabel>
										<Input
											{...field}
											type="email"
											id="signin-email"
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
										<FieldLabel
											htmlFor="signin-password"
											className="flex justify-between"
										>
											비밀번호
											<Link to="/user/forgot-password">
												비밀번호를 잊으셨나요?
											</Link>
										</FieldLabel>
										<Input
											{...field}
											type="password"
											id="signin-password"
											placeholder="비밀번호"
											autoComplete="current-password"
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
									로그인
								</Button>
								<FieldDescription className="text-center">
									계정이 없으신가요?{' '}
									<Link to="/user/signup">회원가입</Link>
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
