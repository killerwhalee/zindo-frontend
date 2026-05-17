import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 80;

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
	const [pulling, setPulling] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const startY = useRef(0);
	const triggered = useRef(false);
	// Ref keeps the callback stable so the effect only registers once
	const onRefreshRef = useRef(onRefresh);
	onRefreshRef.current = onRefresh;

	useEffect(() => {
		function handleTouchStart(e: TouchEvent) {
			if (window.scrollY === 0) {
				startY.current = e.touches[0].clientY;
			}
		}

		function handleTouchMove(e: TouchEvent) {
			if (!startY.current) return;
			const delta = e.touches[0].clientY - startY.current;
			triggered.current = delta >= THRESHOLD && window.scrollY === 0;
			setPulling(triggered.current);
		}

		async function handleTouchEnd() {
			if (triggered.current) {
				setPulling(false);
				setRefreshing(true);
				await onRefreshRef.current();
				setRefreshing(false);
			} else {
				setPulling(false);
			}
			triggered.current = false;
			startY.current = 0;
		}

		document.addEventListener('touchstart', handleTouchStart, { passive: true });
		document.addEventListener('touchmove', handleTouchMove, { passive: true });
		document.addEventListener('touchend', handleTouchEnd);

		return () => {
			document.removeEventListener('touchstart', handleTouchStart);
			document.removeEventListener('touchmove', handleTouchMove);
			document.removeEventListener('touchend', handleTouchEnd);
		};
	}, []);

	return { pulling, refreshing };
}
