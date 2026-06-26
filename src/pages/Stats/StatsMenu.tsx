import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/layout/TopBar';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StatsMenu() {
	const navigate = useNavigate();

	return (
		<div className="pt-16">
			<TopBar title="학습 통계" />
			<div className="p-4 space-y-3">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">학습 통계 메뉴</h3>

				<Card className="cursor-pointer" onClick={() => navigate('/stats/individual')}>
					<CardHeader>
						<div className="flex items-start gap-4">
							<div>
								<CardTitle>개인 통계</CardTitle>
								<CardDescription className="mt-3">
									학생별 학습 통계를 조회하고 PDF로 내보냅니다.
									<br />
									개별 가정통신문을 함께 작성할 수 있습니다.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
				</Card>

				<Card className="cursor-pointer" onClick={() => navigate('/stats/batch')}>
					<CardHeader>
						<div className="flex items-start gap-4">
							<div>
								<CardTitle>통계 모음</CardTitle>
								<CardDescription className="mt-3">
									여러 학생의 통계를 한꺼번에 확인합니다.
									<br />
									개별 및 단체 가정통신문을 작성할 수 있습니다.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
				</Card>
			</div>
		</div>
	);
}
