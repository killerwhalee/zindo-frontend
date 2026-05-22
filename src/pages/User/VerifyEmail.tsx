import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleCheckIcon, Loader2Icon, OctagonXIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import api from '@/lib/api';

type State = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
	const [searchParams] = useSearchParams();
	const [state, setState] = useState<State>('loading');
	const [message, setMessage] = useState('');

	useEffect(() => {
		const token = searchParams.get('token');

		if (!token) {
			setState('error');
			setMessage('유효하지 않은 인증 링크입니다.');
			return;
		}

		api
			.get(`/user/auth/verify-email/`, { params: { token } })
			.then(() => setState('success'))
			.catch((err) => {
				setState('error');
				setMessage(
					err?.response?.data?.detail ?? '인증에 실패했습니다. 링크가 만료되었을 수 있습니다.',
				);
			});
	}, [searchParams]);

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
					<CardTitle className="text-lg">이메일 인증</CardTitle>
					<CardDescription>계정 인증을 처리하고 있습니다.</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col items-center gap-4 py-4">
					{state === 'loading' && (
						<>
							<Loader2Icon className="size-12 animate-spin text-muted-foreground" />
							<p className="text-muted-foreground text-sm">인증 중...</p>
						</>
					)}

					{state === 'success' && (
						<>
							<CircleCheckIcon className="size-12 text-green-500" />
							<div className="text-center space-y-1">
								<p className="font-semibold">이메일 인증이 완료되었습니다!</p>
								<p className="text-muted-foreground text-sm">
									이제 로그인하여 서비스를 이용하실 수 있습니다.
								</p>
							</div>
							<Button asChild className="w-full">
								<Link to="/user/signin">로그인하기</Link>
							</Button>
						</>
					)}

					{state === 'error' && (
						<>
							<OctagonXIcon className="size-12 text-destructive" />
							<div className="text-center space-y-1">
								<p className="font-semibold">인증에 실패했습니다</p>
								<p className="text-muted-foreground text-sm">{message}</p>
							</div>
							<Button asChild variant="outline" className="w-full">
								<Link to="/user/signin">로그인 페이지로 이동</Link>
							</Button>
						</>
					)}
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
