import { RefreshCwIcon } from 'lucide-react';
import { PULL_THRESHOLD, type RefreshState } from '@/lib/usePullToRefresh';

interface Props {
	refreshState: RefreshState;
	pullDistance: number;
}

export default function PullToRefreshIndicator({ refreshState, pullDistance }: Props) {
	const isPulling = refreshState === 'pulling';
	const isTriggered = refreshState === 'triggered';
	const isRefreshing = refreshState === 'refreshing';
	const isActive = refreshState !== 'idle';

	// Height tracks finger linearly during pull (capped at 48px at threshold).
	// Once released, holds at 48px (refreshing) or collapses to 0px (idle).
	const height = isPulling
		? Math.min((pullDistance / PULL_THRESHOLD) * 48, 48)
		: isActive
			? 48
			: 0;

	// Icon rotates 0→180° as pull progresses, flips fully when triggered.
	const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
	const iconRotation = isRefreshing ? undefined : `rotate(${progress * 180}deg)`;

	const text = isRefreshing
		? '새로고침 중...'
		: isTriggered
			? '놓아서 새로고침'
			: '당겨서 새로고침';

	return (
		<div
			className="overflow-hidden flex items-center justify-center gap-2"
			style={{
				height,
				opacity: isActive ? 1 : 0,
				// No transition while pulling — must follow finger instantly.
				// Transition on release for smooth collapse / expand.
				transition: isPulling ? 'none' : 'height 0.25s ease-out, opacity 0.25s ease-out',
			}}
		>
			<RefreshCwIcon
				className={`size-4 text-muted-foreground shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}
				style={iconRotation ? { transform: iconRotation } : undefined}
			/>
			<span className="text-sm text-muted-foreground">{text}</span>
		</div>
	);
}
