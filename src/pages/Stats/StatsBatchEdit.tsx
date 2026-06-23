import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';
import { Trash2Icon } from 'lucide-react';
import api from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { convertGrade } from '@/lib/utils';
import type { Student } from '@/components/types';
import { useBatchContext } from '@/pages/Stats/batchShared';

export default function StatsBatchEdit() {
	const navigate = useNavigate();
	const { batch, reload } = useBatchContext();
	const today = new Date();

	const [allStudents, setAllStudents] = useState<Student[]>([]);
	const [start, setStart] = useState(batch.start_date ?? '');
	const [end, setEnd] = useState(batch.end_date ?? '');
	const [ids, setIds] = useState<Set<number>>(new Set(batch.student_ids));
	const [error, setError] = useState('');
	const [saving, setSaving] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		api
			.get('/zindo/students/', { params: { ordering: 'name' } })
			.then((res) => setAllStudents(res.data.filter((s: Student) => s.is_active)))
			.catch((e) => console.error(e));
	}, []);

	const applyPreset = (preset: 'month' | 'quarter' | 'year' | 'all') => {
		if (preset === 'all') { setStart(''); setEnd(''); return; }
		const from =
			preset === 'month' ? startOfMonth(today)
				: preset === 'quarter' ? startOfQuarter(today)
					: startOfYear(today);
		setStart(format(from, 'yyyy-MM-dd'));
		setEnd(format(today, 'yyyy-MM-dd'));
	};

	const toggleId = (id: number) => {
		setIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id); else next.add(id);
			return next;
		});
	};

	const toggleAll = () => {
		setIds((prev) =>
			prev.size === allStudents.length ? new Set() : new Set(allStudents.map((s) => s.id)),
		);
	};

	const save = async () => {
		setError('');
		if (ids.size === 0) { setError('학생을 한 명 이상 선택해 주세요.'); return; }
		setSaving(true);
		try {
			await api.patch(`/zindo/stats-batches/${batch.id}/`, {
				start_date: start || null,
				end_date: end || null,
				student_ids: [...ids],
			});
			await reload(); // recompute everything in the layout
			navigate(-1);
		} catch (e) {
			console.error(e);
			setError('저장 중 오류가 발생했습니다.');
			setSaving(false);
		}
	};

	const deleteBatch = async () => {
		setDeleting(true);
		try {
			await api.delete(`/zindo/stats-batches/${batch.id}/`);
			navigate('/stats/batch', { replace: true });
		} catch (e) {
			console.error(e);
			setDeleting(false);
		}
	};

	return (
		<div className="pt-16 pb-8">
			<TopBar title="설정 변경" />

			<div className="p-4 space-y-6">
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
						<Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="flex-1 min-w-0" />
						<span className="text-muted-foreground shrink-0">~</span>
						<Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="flex-1 min-w-0" />
					</div>
				</div>

				{/* Student selection */}
				<div className="space-y-2">
					<Label>학생 선택</Label>
					<div
						className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
						onClick={toggleAll}
					>
						<Checkbox
							checked={ids.size === allStudents.length && allStudents.length > 0}
							onCheckedChange={toggleAll}
							onClick={(e) => e.stopPropagation()}
						/>
						<span className="text-sm font-medium">
							{ids.size === allStudents.length ? '전체 해제' : '전체 선택'}
						</span>
						<span className="text-xs text-muted-foreground ml-auto">
							{ids.size}/{allStudents.length}명
						</span>
					</div>
					{allStudents.map((s) => (
						<div
							key={s.id}
							className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
							onClick={() => toggleId(s.id)}
						>
							<Checkbox
								checked={ids.has(s.id)}
								onCheckedChange={() => toggleId(s.id)}
								onClick={(e) => e.stopPropagation()}
							/>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium">{s.name}</p>
								<p className="text-xs text-muted-foreground">{convertGrade(s.grade)}</p>
							</div>
						</div>
					))}
				</div>

				{error && <p className="text-sm text-destructive">{error}</p>}

				<div className="flex gap-2">
					<Button className="flex-1" onClick={save} disabled={saving}>
						{saving ? '저장 중...' : '변경 사항 저장'}
					</Button>
					<Button variant="outline" className="flex-1" onClick={() => navigate(-1)} disabled={saving}>
						취소
					</Button>
				</div>

				<Separator />

				{/* Delete */}
				<Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
					<Trash2Icon className="size-4 mr-1" />
					이 통계 삭제
				</Button>
			</div>

			{/* Delete confirmation */}
			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>통계를 삭제할까요?</DialogTitle>
						<DialogDescription>
							"{batch.title}" 통계와 작성한 가정통신문이 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="destructive" onClick={deleteBatch} disabled={deleting}>
							{deleting ? '삭제 중...' : '삭제'}
						</Button>
						<DialogClose asChild>
							<Button variant="outline">취소</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
