import { LoaderIcon } from 'lucide-react';

export default function Loading({
	message = 'Loading...',
}: {
	message?: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
			<LoaderIcon className="w-6 h-6 animate-spin mb-2" />
			<span>{message}</span>
		</div>
	);
}
