import { useEffect, useRef, useState } from 'react';

export const PULL_THRESHOLD = 80;

export type RefreshState = 'idle' | 'pulling' | 'triggered' | 'refreshing';

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
	const [refreshState, setRefreshState] = useState<RefreshState>('idle');
	const [pullDistance, setPullDistance] = useState(0);

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
			const delta = Math.max(0, e.touches[0].clientY - startY.current);
			const shouldTrigger = delta >= PULL_THRESHOLD;
			triggered.current = shouldTrigger;
			setPullDistance(delta);
			setRefreshState(shouldTrigger ? 'triggered' : delta > 0 ? 'pulling' : 'idle');
		}

		async function handleTouchEnd() {
			if (!isTouching.current) return;
			isTouching.current = false;
			startY.current = 0;

			if (triggered.current) {
				triggered.current = false;
				setPullDistance(0);
				setRefreshState('refreshing');
				await onRefreshRef.current();
				setRefreshState('idle');
			} else {
				triggered.current = false;
				setPullDistance(0);
				setRefreshState('idle');
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

	return { refreshState, pullDistance };
}
