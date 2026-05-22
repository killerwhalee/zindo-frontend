import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import TopBar from '@/components/layout/TopBar';
import { useEffect, useState } from 'react';
import { type Student, type Sheet } from '@/components/types';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { convertGrade } from '@/lib/utils';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import { BookIcon, MoreHorizontalIcon } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

function SheetCard({ sheet, finished }: { sheet: Sheet; finished?: boolean }) {
	return (
		<Link
			to={`/record/?sheetId=${sheet.id}`}
			className="block"
		>
			<Card className="max-w-lg py-0 flex-row gap-0">
				<CardHeader className="py-6 min-w-54">
					<CardTitle>{sheet.textbook_detail.name}</CardTitle>
					<CardDescription>
						{sheet.textbook_detail.subject}
						{finished ? (
							<>
								<Separator />
								ISBN {sheet.textbook_detail.isbn}
							</>
						) : (
							<>
								{' '}
								|{' '}
								{sheet.is_recorded ? (
									<span className="text-blue-400">오늘 기록 있음</span>
								) : (
									<span className="text-orange-400">오늘 기록 없음</span>
								)}
							</>
						)}
					</CardDescription>
				</CardHeader>
				<CardContent className="grow-1 px-0">
					{sheet.textbook_detail.image ? (
						<img
							src={sheet.textbook_detail.image}
							alt="Book Cover"
							className="size-full rounded-r-xl"
						/>
					) : (
						<div className="size-full rounded-r-xl bg-muted flex flex-col items-center justify-center gap-1 text-muted-foreground">
							<BookIcon className="size-6" />
							<span className="text-xs">표지 없음</span>
						</div>
					)}
				</CardContent>
			</Card>
		</Link>
	);
}

export default function SheetList() {
	// Get query params
	const [searchParams] = useSearchParams();
	const studentId = searchParams.get('studentId') || '';
	const navigate = useNavigate();

	// State for API call
	const [student, setStudent] = useState<Student>();
	const [sheets, setSheets] = useState<Sheet[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshKey, setRefreshKey] = useState(0);

	const { refreshState, pullDistance } = usePullToRefresh(() => setRefreshKey((k) => k + 1));

	// State for archive/activate dialog
	const [openAction, setOpenAction] = useState(false);
	const [openResult, setOpenResult] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	// fetch data from api
	useEffect(() => {
		async function fetchData() {
			try {
				const [studentRes, sheetRes] = await Promise.all([
					api.get<Student>(`/zindo/students/${studentId}`),
					api.get<Sheet[]>('/zindo/sheets', {
						params: { student__id: studentId },
					}),
				]);

				setStudent(studentRes.data);
				setSheets(sheetRes.data);
			} catch (err) {
				console.error('Failed to load data:', err);
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [studentId, refreshKey]);

	async function onSubmitAction() {
		const nextActive = !student?.is_active;
		try {
			await api.patch(`/zindo/students/${studentId}/`, {
				is_active: nextActive,
			});
			setIsSuccess(true);
		} catch (err) {
			console.error('Failed to update student:', err);
			setIsSuccess(false);
		} finally {
			setOpenAction(false);
			setOpenResult(true);
		}
	}

	const isInitialLoad = loading && !student;

	const sheetsOngoing = sheets.filter((sheet) => !sheet.is_finished);
	const sheetsFinished = sheets.filter((sheet) => sheet.is_finished);
	const isActive = student?.is_active ?? true;

	return (
		<div className="pt-16">
			<TopBar title="학습상황기록지 목록" />
			<PullToRefreshIndicator refreshState={refreshState} pullDistance={pullDistance} />
			<div className="p-4 space-y-3">
				<div className="flex justify-between items-center">
					{isInitialLoad ? (
						<Skeleton className="h-8 w-40" />
					) : (
						<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
							{student?.name} ({convertGrade(student?.grade || 99)})
						</h3>
					)}

					{/* Dropdown menu */}
					<div>
						<DropdownMenu modal={false}>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="outline"
									size="icon-sm"
								>
									<MoreHorizontalIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem
									onSelect={() => navigate(`/student/${studentId}/edit`)}
								>
									학생 정보 수정
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setOpenAction(true)}>
									{isActive ? '아동 보관' : '아동 활성화'}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Confirmation dialog */}
						<Dialog
							open={openAction}
							onOpenChange={setOpenAction}
						>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>
										{isActive ? '아동 보관' : '아동 활성화'}
									</DialogTitle>
								</DialogHeader>
								<div className="space-y-3">
									<p className="text-center">
										{isActive ? (
											<>
												해당 아동을 보관 처리하겠습니까? <br />
												보관 처리된 이후에는 활성 목록에서 보이지 않습니다.
											</>
										) : (
											<>
												해당 아동을 다시 활성화하겠습니까? <br />
												활성화된 이후에는 활성 목록에서 다시 보입니다.
											</>
										)}
									</p>
									<DialogFooter>
										<div className="grid grid-cols-2 gap-4">
											<DialogClose asChild>
												<Button
													variant="secondary"
													className="w-full"
												>
													취소
												</Button>
											</DialogClose>
											<Button
												type="button"
												onClick={onSubmitAction}
											>
												{isActive ? '보관 처리' : '활성화'}
											</Button>
										</div>
									</DialogFooter>
								</div>
							</DialogContent>
						</Dialog>

						{/* Result dialog */}
						<Dialog
							open={openResult}
							onOpenChange={setOpenResult}
						>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>
										{isSuccess ? '처리 완료 🥳' : '처리 실패 🥺'}
									</DialogTitle>
								</DialogHeader>

								{isSuccess ? (
									<div className="space-y-3">
										<p className="text-center">
											{isActive
												? '아동이 성공적으로 보관 처리되었습니다.'
												: '아동이 성공적으로 활성화되었습니다.'}
										</p>
										<DialogFooter>
											<Button
												onClick={() => {
													setOpenResult(false);
													navigate('/student');
												}}
											>
												목록으로 돌아가기
											</Button>
										</DialogFooter>
									</div>
								) : (
									<div className="space-y-3">
										<p className="text-center">
											처리에 실패했습니다. <br />
											잠시 후 다시 시도해 주세요.
										</p>
										<DialogFooter>
											<Button
												variant="outline"
												onClick={() => setOpenResult(false)}
											>
												닫기
											</Button>
										</DialogFooter>
									</div>
								)}
							</DialogContent>
						</Dialog>
					</div>
				</div>

				{/* Active student: accordion split by ongoing / finished */}
				{isActive ? (
					<Accordion
						type="single"
						collapsible
						defaultValue="sheets-ongoing"
					>
						<AccordionItem value="sheets-ongoing">
							<AccordionTrigger>진행 중인 교재</AccordionTrigger>
							<AccordionContent className="space-y-3">
								{isInitialLoad ? (
									Array.from({ length: 3 }, (_, i) => (
										<Card key={i} className="max-w-lg py-0 flex-row gap-0">
											<CardHeader className="py-6 min-w-54">
												<Skeleton className="h-5 w-32" />
												<Skeleton className="h-4 w-20" />
											</CardHeader>
											<Skeleton className="grow-1 rounded-r-xl" />
										</Card>
									))
								) : (
									<>
										{sheetsOngoing.map((sheet) => (
											<SheetCard
												key={sheet.id}
												sheet={sheet}
											/>
										))}
										{sheetsOngoing.length === 0 && (
											<div className="text-center">
												현재 진행 중인 교재가 없습니다 🥺
											</div>
										)}
									</>
								)}
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="sheets-finished">
							<AccordionTrigger>완료된 교재</AccordionTrigger>
							<AccordionContent className="space-y-3">
								{sheetsFinished.map((sheet) => (
									<SheetCard
										key={sheet.id}
										sheet={sheet}
										finished
									/>
								))}
								{sheetsFinished.length === 0 && (
									<div className="text-center">
										완료된 교재가 아직 없습니다 🥺
									</div>
								)}
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				) : (
					/* Inactive student: flat list of all sheets */
					<div className="space-y-3">
						{sheets.map((sheet) => (
							<SheetCard
								key={sheet.id}
								sheet={sheet}
								finished={sheet.is_finished}
							/>
						))}
						{sheets.length === 0 && (
							<div className="text-center">등록된 교재가 없습니다 🥺</div>
						)}
					</div>
				)}

				{isActive && (
					<Button
						type="button"
						className="w-full"
					>
						<Link to={`/sheet/new?studentId=${student?.id}`}>새 교재 추가</Link>
					</Button>
				)}
			</div>
		</div>
	);
}
