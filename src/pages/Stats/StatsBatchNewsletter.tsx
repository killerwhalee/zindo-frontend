import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { convertGrade } from '@/lib/utils';
import { useBatchContext } from '@/pages/Stats/batchShared';

export default function StatsBatchNewsletter() {
	const navigate = useNavigate();
	const { studentId } = useParams<{ studentId: string }>();
	const { batch, students, studentNewsletters, setStudentNewsletters } = useBatchContext();

	const student = students.find((s) => String(s.id) === studentId) ?? null;
	const [draft, setDraft] = useState(student ? (studentNewsletters[String(student.id)] ?? '') : '');
	const [saving, setSaving] = useState(false);

	if (!student) {
		return (
			<div className="pt-16 pb-8">
				<TopBar title="개별 가정통신문" />
				<p className="p-8 text-center text-muted-foreground">학생을 찾을 수 없습니다.</p>
			</div>
		);
	}

	const save = async () => {
		setSaving(true);
		const updated = { ...studentNewsletters, [String(student.id)]: draft };
		try {
			await api.patch(`/zindo/stats-batches/${batch.id}/`, { student_newsletters: updated });
			setStudentNewsletters(updated);
			navigate(-1);
		} catch (e) {
			console.error(e);
			setSaving(false);
		}
	};

	return (
		<div className="pt-16 pb-8">
			<TopBar title={`${student.name} 개별 가정통신문`} />

			<div className="p-4 space-y-4">
				<p className="text-sm text-muted-foreground">
					{student.name} ({convertGrade(student.grade)}) 학생에게만 전달할 내용을 입력하세요.
				</p>
				<Textarea
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					placeholder={`${student.name} 학생에 대한 개별 내용을 입력하세요`}
					className="min-h-[240px] resize-none"
				/>
				<div className="flex gap-2">
					<Button className="flex-1" onClick={save} disabled={saving}>
						{saving ? '저장 중...' : '저장'}
					</Button>
					<Button variant="outline" className="flex-1" onClick={() => navigate(-1)} disabled={saving}>
						취소
					</Button>
				</div>
			</div>
		</div>
	);
}
