import { Button } from '@/components/ui/button';
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Controller, useForm } from 'react-hook-form';
import api from '@/lib/api';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Link } from 'react-router-dom';

const formSchema = z.object({
	username: z.string(),
	password: z.string(),
});

export default function SignIn() {
	// Use zod form for validation
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	/**
	 * Function to run after submission
	 */
	async function onSubmit(data: z.infer<typeof formSchema>) {
		try {
			await api.post('/user/signin/', {});
			console.log(data);
		} catch (err) {
			console.error('Failed to post data:', err);
		} finally {
			console.log('finally!');
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
				<CardContent>
					<form
						id="record-write-form"
						onSubmit={form.handleSubmit(onSubmit)}
					>
						<FieldGroup className='gap-4'>
							<Controller
								name="username"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="login-form-username">
											아이디
										</FieldLabel>
										<Input
											{...field}
											type="string"
											id="login-form-username"
											placeholder="아이디"
											autoComplete="off"
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
											htmlFor="login-form-password"
											className="flex justify-between"
										>
											비밀번호
											<Link to="#">비밀번호를 잊으셨나요?</Link>
										</FieldLabel>

										<Input
											{...field}
											type="password"
											id="login-form-password"
											placeholder="비밀번호"
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
								>
									로그인
								</Button>

								<FieldDescription className="text-center">
									계정이 없으신가요? <Link to="/user/signup">회원가입</Link>
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
