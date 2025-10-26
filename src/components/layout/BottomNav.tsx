import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BottomNav() {
	return (
		<div className="fixed bottom-0 left-0 right-0 border-t bg-background py-2 flex justify-center">
			<Link
				to="/"
				className="flex flex-col items-center text-sm"
			>
				<Home className="w-5 h-5" />
				<span>Home</span>
			</Link>
		</div>
	);
}
