import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 80;

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
	const [pulling, setPulling] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const startY = useRef(0);
	const isTouching = useRef(false);
	const triggered = useRef(false);
	// Ref keeps the callback stable so the effect only registers once
	const onRefreshRef = useRef(onRefresh);
	onRefreshRef.current = onRefresh;

	useEffect(() => {
		function handleTouchStart(e: TouchEvent) {
			if (window.scrollY === 0) {
				startY.current = e.touches[0].clientY;
				isTouching.current = true;
			}
		}

		function handleTouchMove(e: TouchEvent) {
			if (!isTouching.current) return;
			const delta = e.touches[0].clientY - startY.current;
			// scrollY check is intentionally omitted here: mobile browsers introduce
			// a tiny scroll offset during a drag gesture which would break the check.
			const shouldTrigger = delta >= THRESHOLD;
			if (shouldTrigger !== triggered.current) {
				triggered.current = shouldTrigger;
				setPulling(shouldTrigger);
			}
		}

		async function handleTouchEnd() {
			if (!isTouching.current) return;
			isTouching.current = false;
			startY.current = 0;
			if (triggered.current) {
				triggered.current = false;
				setPulling(false);
				setRefreshing(true);
				await onRefreshRef.current();
				setRefreshing(false);
			} else {
				triggered.current = false;
			}
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
