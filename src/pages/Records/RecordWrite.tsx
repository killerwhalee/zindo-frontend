import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import TopBar from '@/components/layout/TopBar';
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Controller, useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Record } from '@/components/types';
import api from '@/lib/api';
import Loading from '@/components/layout/Loading';

const formSchema = z.object({
	start: z
		.number('숫자를 입력하세요!')
		.min(0, '페이지 수는 0보다 커야 합니다!!'),
	end: z.number('숫자를 입력하세요!').min(0, '페이지 수는 0보다 커야 합니다!!'),
	note: z.string().optional(),
});

export default function RecordWrite() {
	const { sheetId } = useParams();
	const [records, setRecords] = useState<Record[]>([]);
	const [loading, setLoading] = useState(true);

	// Use zod form for validation
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	// Function to run after submission
	function onSubmit(data: z.infer<typeof formSchema>) {
		// Build the custom JSON structure
		const payload = {
			sheet: Number(sheetId),
			progress: {
				type: 'range',
				start: data.start,
				end: data.end,
			},
			note: data.note,
		};

		console.log(payload);
	}

	// Fetch records from given sheet, and take latest one.
	useEffect(() => {
		api
			.get<Record[]>('/zindo/records?sheet__id=' + sheetId)
			.then((res) => setRecords(res.data))
			.catch((err) => console.error('Failed to load data:', err))
			.finally(() => setLoading(false));
	}, [sheetId]);

	const record_latest = records.at(-1);

	if (loading) return <Loading />;

	return (
		<div className="pt-16">
			<TopBar title="새 학습 기록" />

			<div className="p-4 space-y-4">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
					새 학습 기록 생성
				</h3>
				<p>새로운 학습상황기록을 작성합니다.</p>

				<Alert>
					<InfoIcon />
					<AlertTitle>어제의 학습 기록은 다음과 같습니다:</AlertTitle>
					<AlertDescription>
						{record_latest?.progress.start}p ~ {record_latest?.progress.end}p
					</AlertDescription>
					<AlertDescription>{record_latest?.note}</AlertDescription>
				</Alert>

				<form
					id="record-write-form"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-4">
							<Controller
								name="start"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="record-write-form-start">
											시작 페이지
										</FieldLabel>
										<Input
											{...field}
											type="number"
											id="record-write-form-start"
											placeholder="11"
											autoComplete="off"
											onChange={(e) =>
												field.onChange(
													e.target.value === ''
														? undefined
														: Number(e.target.value)
												)
											}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							></Controller>
							<Controller
								name="end"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="record-write-form-end">
											끝 페이지
										</FieldLabel>
										<Input
											{...field}
											type="number"
											id="record-write-form-end"
											placeholder="23"
											autoComplete="off"
											onChange={(e) =>
												field.onChange(
													e.target.value === ''
														? undefined
														: Number(e.target.value)
												)
											}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							></Controller>
						</div>

						<Controller
							name="note"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field>
									<FieldLabel htmlFor="record-write-form-note">
										오늘의 학습은 어땠나요?
									</FieldLabel>
									<Input
										{...field}
										id="record-write-form-note"
										placeholder="예) 세로식 복습이 필요해 보입니다"
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						></Controller>

						<Field>
							<Button
								type="submit"
								className="w-full"
							>
								저장하기
							</Button>
						</Field>
					</FieldGroup>
				</form>
			</div>
		</div>
	);
}
