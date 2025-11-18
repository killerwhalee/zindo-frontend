import { Routes, Route } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';

// Pages
import Demo from '@/pages/Demo';
import Home from '@/pages/Home';
import StudentList from '@/pages/Students/StudentList';
import SheetList from '@/pages/Sheets/SheetList';
import SheetAdd from '@/pages/Sheets/SheetAdd';
import RecordList from '@/pages/Records/RecordList';
import RecordAdd from '@/pages/Records/RecordAdd';
import RecordEdit from '@/pages/Records/RecordEdit';

export default function App() {
	return (
		<div className="max-w-md mx-auto min-h-screen relative pb-16 bg-background text-foreground">
			<Routes>
				{/* Demo */}
				<Route
					path="/demo"
					element={<Demo />}
				/>

				{/* Home */}
				<Route
					path="/"
					element={<Home />}
				/>

				{/* Students */}
				<Route
					path="/student"
					element={<StudentList />}
				/>

				{/* Sheets */}
				<Route
					path="/student/:studentId"
					element={<SheetList />}
				/>
				<Route
					path="/student/:studentId/new"
					element={<SheetAdd />}
				/>

				{/* Records */}
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
