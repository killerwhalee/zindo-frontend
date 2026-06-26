import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';

// Pages
import Demo from '@/pages/Demo';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';

// Lazy pages
const SignIn = lazy(() => import('@/pages/User/SignIn'));
const SignUp = lazy(() => import('@/pages/User/SignUp'));
const ResetPassword = lazy(() => import('@/pages/User/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/User/VerifyEmail'));
const StudentList = lazy(() => import('@/pages/Students/StudentList'));
const StudentAdd = lazy(() => import('@/pages/Students/StudentAdd'));
const StudentEdit = lazy(() => import('@/pages/Students/StudentEdit'));
const SheetList = lazy(() => import('@/pages/Sheets/SheetList'));
const SheetAdd = lazy(() => import('@/pages/Sheets/SheetAdd'));
const RecordList = lazy(() => import('@/pages/Records/RecordList'));
const RecordAdd = lazy(() => import('@/pages/Records/RecordAdd'));
const RecordEdit = lazy(() => import('@/pages/Records/RecordEdit'));
const StatsMenu = lazy(() => import('@/pages/Stats/StatsMenu'));
const StatsStudentList = lazy(() => import('@/pages/Stats/StatsStudentList'));
const StatsDetail = lazy(() => import('@/pages/Stats/StatsDetail'));
const DailyStudy = lazy(() => import('@/pages/DailyStudy'));
const StatsBatchList = lazy(() => import('@/pages/Stats/StatsBatchList'));
const StatsBatchCreate = lazy(() => import('@/pages/Stats/StatsBatchCreate'));
const StatsBatchDetail = lazy(() => import('@/pages/Stats/StatsBatchDetail'));
const StatsBatchOverview = lazy(() => import('@/pages/Stats/StatsBatchOverview'));
const StatsBatchStudent = lazy(() => import('@/pages/Stats/StatsBatchStudent'));
const StatsBatchNewsletter = lazy(() => import('@/pages/Stats/StatsBatchNewsletter'));
const StatsBatchEdit = lazy(() => import('@/pages/Stats/StatsBatchEdit'));

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
					<Route
						path="forgot-password"
						element={<ResetPassword />}
					/>
					<Route
						path="verify-email"
						element={<VerifyEmail />}
					/>
				</Route>

				{/* Student */}
				<Route path="student">
					<Route
						index
						element={<StudentList />}
					/>
					<Route
						path="new"
						element={<StudentAdd />}
					/>
					<Route
						path=":studentId/edit"
						element={<StudentEdit />}
					/>
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

				{/* Daily study */}
				<Route
					path="daily"
					element={<DailyStudy />}
				/>

				{/* Stats */}
				<Route path="stats">
					<Route
						index
						element={<StatsMenu />}
					/>
					<Route
						path="individual"
						element={<StatsStudentList />}
					/>
					{/* Batch routes must come before :studentId to avoid param collision */}
					<Route path="batch">
						<Route
							index
							element={<StatsBatchList />}
						/>
						<Route
							path="new"
							element={<StatsBatchCreate />}
						/>
						{/* Layout route: loads batch + computes metrics once, shares via Outlet context */}
						<Route
							path=":batchId"
							element={<StatsBatchDetail />}
						>
							<Route
								index
								element={<StatsBatchOverview />}
							/>
							<Route
								path="edit"
								element={<StatsBatchEdit />}
							/>
							<Route
								path="student/:studentId"
								element={<StatsBatchStudent />}
							/>
							<Route
								path="student/:studentId/newsletter"
								element={<StatsBatchNewsletter />}
							/>
						</Route>
					</Route>
					<Route
						path=":studentId"
						element={<StatsDetail />}
					/>
				</Route>

				{/* 404 */}
				<Route
					path="*"
					element={<NotFound />}
				/>
			</Routes>

			<BottomNav />
		</div>
	);
}
