import { useOutletContext } from 'react-router-dom';
import type { StatsBatch, Student } from '@/components/types';
import type { SheetMetrics, StudentMetrics } from '@/lib/stats';
import type { CrossStudentValues } from '@/pages/Stats/StatsReport';

export const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

export function fmt(n: number, decimals = 1): string {
	return n.toFixed(decimals);
}

export function pct(n: number | null): string {
	if (n === null) return '-';
	return `${(n * 100).toFixed(1)}%`;
}

export function shortDate(s: string): string {
	if (!s) return '-';
	return s.slice(5).replace('-', '/');
}

export function dateRangeLabel(startDate: string | null, endDate: string | null): string {
	if (!startDate && !endDate) return '전체 기간';
	const s = startDate ? startDate.slice(5).replace('-', '/') : '';
	const e = endDate ? endDate.slice(5).replace('-', '/') : '';
	if (!s) return `~ ${e}`;
	if (!e) return `${s} ~`;
	return `${s} ~ ${e}`;
}

export interface StudentMetricsResult {
	studentId: number;
	sheetMetrics: SheetMetrics[];
	studentMetrics: StudentMetrics;
	pieChartUrl: string;
}

/** Shared via <Outlet context>, computed once by StatsBatchDetail (the layout route). */
export interface BatchContext {
	batch: StatsBatch;
	students: Student[];
	metricsResults: StudentMetricsResult[];
	crossValues: CrossStudentValues | null;
	globalNewsletter: string;
	setGlobalNewsletter: (v: string) => void;
	studentNewsletters: Record<string, string>;
	setStudentNewsletters: (v: Record<string, string>) => void;
	reload: () => Promise<void>;
}

export function useBatchContext(): BatchContext {
	return useOutletContext<BatchContext>();
}
