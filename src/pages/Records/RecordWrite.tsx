// src/pages/Records/RecordWrite.tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import TopBar from '@/components/layout/TopBar';

export default function RecordWrite() {
	const navigate = useNavigate();
	const { subjectId, studentId } = useParams();
	const [text, setText] = useState('');

	function handleSubmit() {
		console.log('Saved:', { subjectId, text });
		navigate(-1); // go back to record list
	}

	return (
		<div className="pb-16">
			<TopBar title="New Record" />
			<div className="p-4 space-y-4">
				<Textarea
					placeholder="Write study notes here..."
					value={text}
					onChange={(e) => setText(e.target.value)}
					className="h-40"
				/>
				<Button
					className="w-full"
					onClick={handleSubmit}
				>
					Save
				</Button>
			</div>
		</div>
	);
}
