import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';

// Pages
import Demo from '@/pages/Demo';
const Home = lazy(() => import('@/pages/Home'));
const StudentList = lazy(() => import('@/pages/Students/StudentList'));
const SheetList = lazy(() => import('@/pages/Sheets/SheetList'));
const SheetAdd = lazy(() => import('@/pages/Sheets/SheetAdd'));
const RecordList = lazy(() => import('@/pages/Records/RecordList'));
const RecordAdd = lazy(() => import('@/pages/Records/RecordAdd'));
const RecordEdit = lazy(() => import('@/pages/Records/RecordEdit'));

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
