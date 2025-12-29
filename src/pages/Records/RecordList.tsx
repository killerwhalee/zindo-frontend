import { Link, useSearchParams } from 'react-router-dom';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import TopBar from '@/components/layout/TopBar';
import type { Record, Sheet } from '@/components/types';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Loading from '@/components/layout/Loading';
import {
	CheckIcon,
	Minus,
	MoreHorizontalIcon,
	Plus,
	PlusIcon,
} from 'lucide-react';
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
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '@/components/ui/drawer';
import { DialogDescription } from '@radix-ui/react-dialog';

export default function RecordList() {
	// Get query params
	const [searchParams] = useSearchParams();
	const sheetId = searchParams.get('sheetId');

	// State for record fetching
	const [records, setRecords] = useState<Record[]>([]);
	const [sheet, setSheet] = useState<Sheet>();
	const [loading, setLoading] = useState(true);

	// State for pace setting
	const [openPace, setOpenPace] = useState(false);
	const [pace, setPace] = useState(4);

	// State for finish sheet
	const [openFinish, setOpenFinish] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [openResult, setOpenResult] = useState(false);

	async function onSubmitPace() {
		try {
			await api.patch(`/zindo/sheets/${sheetId}/`, {
				pace: pace,
			});
			setIsSuccess(true);
		} catch (err) {
			console.error('Failed to patch data:', err);
			setIsSuccess(false);
		} finally {
			setOpenPace(false);
			setLoading(true);
		}
	}

	/**
	 * Function to run after submission
	 */
	async function onSubmitFinish() {
		try {
			await api.patch(`/zindo/sheets/${sheetId}/`, {
				is_finished: true,
			});
			setIsSuccess(true);
		} catch (err) {
			console.error('Failed to patch data:', err);
			setIsSuccess(false);
		} finally {
			setOpenFinish(false);
			setOpenResult(true);
		}
	}

	/**
	 * Function to adjust pace
	 *
	 * Pace limit is [1, 42].
	 * There's no reason to be 42; It's the ultimate answer for everything.
	 */
	function onClick(adjustment: number) {
		setPace(Math.max(1, Math.min(42, pace + adjustment)));
	}

	useEffect(() => {
		async function fetchData() {
			try {
				const [recordsRes, sheetRes] = await Promise.all([
					api.get<Record[]>('/zindo/records', {
						params: { sheet__id: sheetId },
					}),
					api.get<Sheet>(`/zindo/sheets/${sheetId}/`),
				]);

				// fetch data from response
				setRecords(recordsRes.data);
				setSheet(sheetRes.data);

				// set initial pace
				setPace(sheetRes.data.pace);
			} catch (err) {
				console.error('Failed to load data:', err);
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [sheetId, loading]);

	if (loading) return <Loading />;

	return (
		<div className="pt-16">
			<TopBar title={`학습상황기록지`} />

			<div className="p-4 space-y-3">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
					{sheet?.textbook_detail.name}
				</h3>

				{/* Daily pace display */}
				<div className="flex justify-between">
					<div className="content-center">
						<p>
							일일 학습 목표:{' '}
							{sheet?.pace ? `${sheet.pace}페이지` : '지정되지 않음'}
						</p>
						{!sheet?.pace && (
							<p className="text-xs text-muted-foreground">
								일일 학습 목표를 지정해주세요!
							</p>
						)}
					</div>

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
								<DropdownMenuItem onSelect={() => setOpenPace(true)}>
									학습 목표 설정
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setOpenFinish(true)}>
									기록 완료 처리
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Drawer for pace setting */}
						<Drawer
							open={openPace}
							onOpenChange={setOpenPace}
						>
							<DrawerContent>
								<DrawerHeader>
									<DrawerTitle>일일 학습 목표 설정</DrawerTitle>
									<DrawerDescription>
										하루에 몇 페이지씩 풀까요?
									</DrawerDescription>
								</DrawerHeader>

								<div className="p-4">
									<div className="flex items-center justify-center space-x-2">
										<Button
											variant="outline"
											size="icon"
											className="h-16 w-16"
											onClick={() => onClick(-1)}
											disabled={pace <= 1}
										>
											<Minus />
										</Button>

										<div className="flex-1 text-center">
											<div className="text-7xl font-bold tracking-tighter">
												{pace}
											</div>
											<div className="text-muted-foreground text-xs">
												페이지
											</div>
										</div>

										<Button
											variant="outline"
											size="icon"
											className="h-16 w-16"
											onClick={() => onClick(1)}
											disabled={pace >= 42}
										>
											<Plus />
										</Button>
									</div>
								</div>

								<DrawerFooter>
									<div className="grid grid-cols-2 gap-4">
										<Button
											type="button"
											onClick={onSubmitPace}
										>
											설정 완료
										</Button>
										<DrawerClose asChild>
											<Button
												type="button"
												variant="secondary"
											>
												취소
											</Button>
										</DrawerClose>
									</div>
								</DrawerFooter>
							</DrawerContent>
						</Drawer>

						{/* Dialog for finish sheet */}
						<Dialog
							open={openFinish}
							onOpenChange={setOpenFinish}
						>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>기록 완료 처리</DialogTitle>
									<DialogDescription></DialogDescription>
								</DialogHeader>

								<div className="space-y-3">
									<p className="text-center">
										해당 기록지를 완료 처리하겠습니까? <br />
										완료 처리된 이후에는 수정이 불가합니다.
									</p>
									<DialogFooter>
										<div className="grid grid-cols-2 gap-4">
											<DialogClose>
												<Button
													variant="secondary"
													className="w-full"
												>
													취소
												</Button>
											</DialogClose>
											<Button
												type="button"
												onClick={onSubmitFinish}
											>
												완료 처리
											</Button>
										</div>
									</DialogFooter>
								</div>
							</DialogContent>
						</Dialog>

						{/* Dialog for result */}
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
											기록지가 성공적으로 완료 처리되었습니다.
										</p>
										<DialogFooter>
											<Button
												onClick={() => {
													setOpenResult(false);
													// Navigate back to the sheet list
													window.history.back();
												}}
											>
												목록으로 돌아가기
											</Button>
										</DialogFooter>
									</div>
								) : (
									<div className="space-y-3">
										<p className="text-center">
											기록지 완료 처리에 실패했습니다. <br />
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

				{/* display button only if sheet is not finished */}

				{/* Record table */}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>날짜</TableHead>
							<TableHead>진도상황</TableHead>
							<TableHead>메모</TableHead>
							<TableHead></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{/* add record button */}
						<TableRow>
							<TableCell colSpan={4}>
								{sheet?.is_finished ? (
									<Button
										type="button"
										size="sm"
										variant="secondary"
										className="w-full"
										disabled
									>
										<CheckIcon />
										완료된 기록지입니다.
									</Button>
								) : (
									<Link to={`/record/new?sheetId=${sheet?.id}`}>
										<Button
											type="button"
											size="sm"
											variant="secondary"
											className="w-full"
										>
											<PlusIcon />새 기록 작성
										</Button>
									</Link>
								)}
							</TableCell>
						</TableRow>

						{records.map((record) => (
							<TableRow key={record.id}>
								<TableCell className="font-medium">
									{record.created_at.slice(0, 10)}
								</TableCell>
								<TableCell>
									{record.progress.start}p ~ {record.progress.end}p
								</TableCell>
								<TableCell className="whitespace-normal break-words align-middle">
									{record.note}
								</TableCell>
								<TableCell>
									<DropdownMenu>
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
											<DropdownMenuItem>
												<Link to={`/record/${record.id}/edit`}>수정하기</Link>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
						{records.length === 0 && (
							<TableRow>
								<TableCell
									className="text-center"
									colSpan={3}
								>
									작성된 기록이 아직 없습니다 🥺
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
