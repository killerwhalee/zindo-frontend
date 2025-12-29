import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';

export default function TopBar({ title }: { title: string }) {
	const navigate = useNavigate();

	return (
		<div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 p-4 border-b bg-white">
			<button onClick={() => navigate(-1)}>
				<ArrowLeftIcon className="w-5 h-5" />
			</button>
			<h1 className="text-lg font-semibold">{title}</h1>
		</div>
	);
}
