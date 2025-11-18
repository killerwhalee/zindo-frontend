import { Link } from 'react-router-dom';

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export default function Home() {
	return (
		<div className="pt-16">
			<div className="mb-10">
				<h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
					zindo
				</h1>
				<h2 className="text-center text-xl font-bold">
					내 손 안의 학습상황기록지
				</h2>
			</div>

			<div className="p-4 space-y-3">
				<Card>
					<Link to="/student">
						<CardHeader className="text-center">
							<CardTitle className="text-lg">학습 상황 기록하기</CardTitle>
							<CardDescription>
								학생과 교재를 선택하여 기록하세요.
							</CardDescription>
						</CardHeader>
					</Link>
				</Card>

				<Card>
					<Link to="#">
						<CardHeader className="text-center text-muted-foreground">
							<CardTitle className="text-lg">
								오늘의 학습상황 (준비중)
							</CardTitle>
							<CardDescription>
								오늘의 학습상황을 한 눈에 확인하세요.
							</CardDescription>
						</CardHeader>
					</Link>
				</Card>

				<Card>
					<Link to="#">
						<CardHeader className="text-center text-muted-foreground">
							<CardTitle className="text-lg">학습 통계 (준비중)</CardTitle>
							<CardDescription>
								지금까지의 학습 과정을 되돌아보아요.
							</CardDescription>
						</CardHeader>
					</Link>
				</Card>
			</div>

			<div className="my-10">
				<p className="text-center text-xs text-muted-foreground">
					© {new Date().getFullYear()} Chaemin Lim.
				</p>
			</div>
		</div>
	);
}
