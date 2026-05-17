import { SearchXIcon } from 'lucide-react';

export default function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
			<SearchXIcon className="size-16 text-muted-foreground" />
			<div className="space-y-1">
				<h1 className="text-4xl font-bold">404</h1>
				<p className="text-muted-foreground">페이지를 찾을 수 없습니다.</p>
			</div>
		</div>
	);
}
