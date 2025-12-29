import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';

// Pages
import Demo from '@/pages/Demo';

// Lazy pages
const Home = lazy(() => import('@/pages/Home'));
const SignIn = lazy(() => import('@/pages/User/SignIn'));
const SignUp = lazy(() => import('@/pages/User/SignUp'));
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
				{/* Home */}
				<Route
					index
					element={<Home />}
				/>

				{/* Demo */}
				<Route
					path="demo"
					element={<Demo />}
				/>

				{/* User */}
				<Route path="user">
					<Route
						path="signin"
						element={<SignIn />}
					/>
					<Route
						path="signup"
						element={<SignUp />}
					/>
					<Route path="forgot-password" />
				</Route>

				{/* Student */}
				<Route path="student">
					<Route
						index
						element={<StudentList />}
					/>
					<Route path="new" />
					<Route path=":studentId/edit" />
				</Route>

				{/* Sheet */}
				<Route path="sheet">
					<Route
						index
						element={<SheetList />}
					/>
					<Route
						path="new"
						element={<SheetAdd />}
					/>
					<Route path=":sheetId/edit" />
				</Route>

				{/* Record */}
				<Route path="record">
					<Route
						index
						element={<RecordList />}
					/>
					<Route
						path="new"
						element={<RecordAdd />}
					/>
					<Route
						path=":recordId/edit"
						element={<RecordEdit />}
					/>
				</Route>
			</Routes>

			<BottomNav />
		</div>
	);
}
