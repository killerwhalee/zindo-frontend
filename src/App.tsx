import { Routes, Route } from 'react-router-dom';
import StudentList from '@/pages/Students/StudentList';
import SheetList from '@/pages/Sheets/SheetList';
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
					element={<SheetList />}
				/>
				<Route
					path="/student/:studentId/sheet/:sheetId"
					element={<RecordList />}
				/>
				<Route
					path="/student/:studentId/sheet/:sheetId/new"
					element={<RecordWrite />}
				/>
			</Routes>
			<BottomNav />
		</div>
	);
}
