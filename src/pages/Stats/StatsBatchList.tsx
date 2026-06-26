import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusIcon } from 'lucide-react';
import type { StatsBatch } from '@/components/types';

function dateRangeLabel(batch: StatsBatch): string {
	if (!batch.start_date && !batch.end_date) return '전체 기간'
	const s = batch.start_date ? batch.start_date.slice(5).replace('-', '/') : ''
	const e = batch.end_date ? batch.end_date.slice(5).replace('-', '/') : ''
	if (!s) return `~ ${e}`
	if (!e) return `${s} ~`
	return `${s} ~ ${e}`
}

export default function StatsBatchList() {
	const navigate = useNavigate()
	const [batches, setBatches] = useState<StatsBatch[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		api
			.get('/zindo/stats-batches/')
			.then((res) => setBatches(res.data))
			.catch((err) => console.error(err))
			.finally(() => setLoading(false))
	}, [])

	return (
		<div className="pt-16 pb-8">
			<TopBar title="통계 모음" />

			<div className="p-4 space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">통계 모음</h3>
					<Button size="sm" onClick={() => navigate('/stats/batch/new')}>
						<PlusIcon className="size-4 mr-1" />
						새로 만들기
					</Button>
				</div>

				{loading ? (
					<div className="space-y-3">
						{Array.from({ length: 3 }, (_, i) => (
							<Card key={i}>
								<CardHeader>
									<Skeleton className="h-5 w-32" />
									<Skeleton className="h-4 w-48" />
								</CardHeader>
							</Card>
						))}
					</div>
				) : batches.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
						<p className="text-muted-foreground">작성된 가정통신문이 없습니다.</p>
						<Button onClick={() => navigate('/stats/batch/new')}>새로 만들기</Button>
					</div>
				) : (
					<div className="space-y-3">
						{batches.map((batch) => (
							<div
								key={batch.id}
								className="cursor-pointer"
								onClick={() => navigate(`/stats/batch/${batch.id}`)}
							>
								<Card>
									<CardHeader>
										<CardTitle>{batch.title}</CardTitle>
										<CardDescription>
											{dateRangeLabel(batch)} · 학생 {batch.student_ids.length}명
										</CardDescription>
									</CardHeader>
								</Card>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
