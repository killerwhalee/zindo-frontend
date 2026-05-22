import { isAxiosError } from 'axios';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheckIcon, OctagonXIcon } from 'lucide-react';

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

const formSchema = z.object({
	email: z.email('올바른 이메일 주소를 입력하세요.'),
});

type FormValues = z.infer<typeof formSchema>;
type AlertState = { type: 'success' | 'error'; message: string } | null;

export default function ResetPassword() {
	const [alert, setAlert] = useState<AlertState>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { email: '' },
	});

	async function onSubmit(data: FormValues) {
		setAlert(null);
		try {
			await api.post('/user/auth/password-reset/', { email: data.email });
			setAlert({
				type: 'success',
				message: '비밀번호 재설정 메일이 발송되었습니다. 이메일을 확인해주세요.',
			});
			form.reset();
		} catch (err) {
			if (isAxiosError(err) && err.response?.data?.detail) {
				setAlert({ type: 'error', message: err.response.data.detail });
			} else {
				setAlert({ type: 'error', message: '요청에 실패했습니다. 다시 시도해주세요.' });
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
					<CardTitle className="text-lg">비밀번호 재설정</CardTitle>
					<CardDescription>
						가입한 이메일로 재설정 링크를 보내드립니다.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{alert && (
						<Alert
							variant={alert.type === 'error' ? 'destructive' : 'default'}
							className={
								alert.type === 'success'
									? 'border-green-500 bg-green-50 text-green-800'
									: undefined
							}
						>
							{alert.type === 'success' ? (
								<CircleCheckIcon />
							) : (
								<OctagonXIcon />
							)}
							<AlertDescription className={alert.type === 'success' ? 'text-green-700' : undefined}>
								{alert.message}
							</AlertDescription>
						</Alert>
					)}

					<form onSubmit={form.handleSubmit(onSubmit)}>
						<FieldGroup className="gap-4">
							<Controller
								name="email"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="reset-email">이메일</FieldLabel>
										<Input
											{...field}
											type="email"
											id="reset-email"
											placeholder="email@example.com"
											autoComplete="email"
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
									재설정 링크 보내기
								</Button>
								<FieldDescription className="text-center">
									<Link to="/user/signin">로그인으로 돌아가기</Link>
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
