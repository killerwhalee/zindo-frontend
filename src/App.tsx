import { Routes, Route } from 'react-router-dom';
import StudentList from '@/pages/Students/StudentList';
import SubjectList from '@/pages/Subjects/SubjectList';
import RecordList from '@/pages/Records/RecordList';
import RecordWrite from '@/pages/Records/RecordWrite';
import BottomNav from '@/components/layout/BottomNav';

export default function App() {
	return (
		<div className="max-w-md mx-auto min-h-screen relative pb-16 bg-background text-foreground">
			<Routes>
				<Route
					path="/"
					element={<StudentList />}
				/>
				<Route
					path="/student/:studentId"
					element={<SubjectList />}
				/>
				<Route
					path="/student/:studentId/subject/:subjectId"
					element={<RecordList />}
				/>
				<Route
					path="/student/:studentId/subject/:subjectId/new"
					element={<RecordWrite />}
				/>
			</Routes>
			<BottomNav />
		</div>
	);
}
