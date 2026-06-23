import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';
import api from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { convertGrade } from '@/lib/utils';
import type { Student } from '@/components/types';

export default function StatsBatchCreate() {
	const navigate = useNavigate()
	const today = new Date()

	const [title, setTitle] = useState('')
	const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'))
	const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'))
	const [students, setStudents] = useState<Student[]>([])
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		api
			.get('/zindo/students/', { params: { ordering: 'name' } })
			.then((res) => {
				const active: Student[] = res.data.filter((s: Student) => s.is_active)
				setStudents(active)
				setSelectedIds(new Set(active.map((s) => s.id)))
			})
			.catch((err) => console.error(err))
			.finally(() => setLoading(false))
	}, [])

	const applyPreset = (preset: 'month' | 'quarter' | 'year' | 'all') => {
		if (preset === 'all') {
			setStartDate('')
			setEndDate('')
			return
		}
		const from =
			preset === 'month' ? startOfMonth(today)
				: preset === 'quarter' ? startOfQuarter(today)
					: startOfYear(today)
		setStartDate(format(from, 'yyyy-MM-dd'))
		setEndDate(format(today, 'yyyy-MM-dd'))
	}

	const toggleStudent = (id: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const toggleAll = () => {
		if (selectedIds.size === students.length) {
			setSelectedIds(new Set())
		} else {
			setSelectedIds(new Set(students.map((s) => s.id)))
		}
	}

	const handleSubmit = async () => {
		setError('')
		if (!title.trim()) { setError('제목을 입력해 주세요.'); return }
		if (selectedIds.size === 0) { setError('학생을 한 명 이상 선택해 주세요.'); return }

		setSubmitting(true)
		try {
			const res = await api.post('/zindo/stats-batches/', {
				title: title.trim(),
				start_date: startDate || null,
				end_date: endDate || null,
				student_ids: [...selectedIds],
			})
			navigate(`/stats/batch/${res.data.id}`, { replace: true })
		} catch (e) {
			console.error(e)
			setError('저장 중 오류가 발생했습니다.')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="pt-16 pb-8">
			<TopBar title="새 가정통신문" />

			<div className="p-4 space-y-6">
				{/* Title */}
				<div className="space-y-2">
					<Label htmlFor="title">제목</Label>
					<Input
						id="title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="예: 2026년 6월 가정통신문"
					/>
				</div>

				{/* Date range */}
				<div className="space-y-2">
					<Label>기간</Label>
					<div className="flex gap-2 flex-wrap">
						<Button size="sm" variant="outline" onClick={() => applyPreset('month')}>이번 달</Button>
						<Button size="sm" variant="outline" onClick={() => applyPreset('quarter')}>이번 분기</Button>
						<Button size="sm" variant="outline" onClick={() => applyPreset('year')}>올해</Button>
						<Button size="sm" variant="outline" onClick={() => applyPreset('all')}>전체</Button>
					</div>
					<div className="flex gap-2 items-center">
						<Input
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							className="flex-1 min-w-0"
						/>
						<span className="text-muted-foreground shrink-0">~</span>
						<Input
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							className="flex-1 min-w-0"
						/>
					</div>
				</div>

				{/* Student selection */}
				<div className="space-y-2">
					<Label>학생 선택</Label>

					{loading ? (
						<div className="space-y-2">
							{Array.from({ length: 4 }, (_, i) => (
								<Card key={i}>
									<CardHeader>
										<Skeleton className="h-5 w-20" />
									</CardHeader>
								</Card>
							))}
						</div>
					) : (
						<div className="space-y-2">
							{/* Select all toggle */}
							<div
								className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
								onClick={toggleAll}
							>
								<Checkbox
									checked={selectedIds.size === students.length && students.length > 0}
									onCheckedChange={toggleAll}
									onClick={(e) => e.stopPropagation()}
								/>
								<span className="text-sm font-medium">
									{selectedIds.size === students.length ? '전체 해제' : '전체 선택'}
								</span>
								<span className="text-xs text-muted-foreground ml-auto">
									{selectedIds.size}/{students.length}명
								</span>
							</div>

							{students.map((student) => (
								<div
									key={student.id}
									className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
									onClick={() => toggleStudent(student.id)}
								>
									<Checkbox
										checked={selectedIds.has(student.id)}
										onCheckedChange={() => toggleStudent(student.id)}
										onClick={(e) => e.stopPropagation()}
									/>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium">{student.name}</p>
										<p className="text-xs text-muted-foreground">{convertGrade(student.grade)}</p>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{error && <p className="text-sm text-destructive">{error}</p>}

				<Button className="w-full" onClick={handleSubmit} disabled={submitting || loading}>
					{submitting ? '만드는 중...' : '만들기'}
				</Button>
			</div>
		</div>
	)
}
