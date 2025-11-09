import { Routes, Route } from 'react-router-dom';
import StudentList from '@/pages/Students/StudentList';
import SheetList from '@/pages/Sheets/SheetList';
import RecordList from '@/pages/Records/RecordList';
import RecordAdd from '@/pages/Records/RecordAdd';
import BottomNav from '@/components/layout/BottomNav';
import { Demo } from './pages/Demo';
import { SheetAdd } from '@/pages/Sheets/SheetAdd';
import RecordEdit from './pages/Records/RecordEdit';

export default function App() {
	return (
		<div className="max-w-md mx-auto min-h-screen relative pb-16 bg-background text-foreground">
			<Routes>
				<Route
					path="/"
					element={<StudentList />}
				/>
				<Route
					path="/demo"
					element={<Demo />}
				/>
				<Route
					path="/student/:studentId"
					element={<SheetList />}
				/>
				<Route
					path="/student/:studentId/new"
					element={<SheetAdd />}
				/>

				<Route
					path="/student/:studentId/sheet/:sheetId"
					element={<RecordList />}
				/>
				<Route
					path="/student/:studentId/sheet/:sheetId/new"
					element={<RecordAdd />}
				/>
				<Route
					path="/student/:studentId/sheet/:sheetId/record/:recordId/edit"
					element={<RecordEdit />}
				/>
			</Routes>
			<BottomNav />
		</div>
	);
}
