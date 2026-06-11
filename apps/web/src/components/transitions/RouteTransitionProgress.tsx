import type { CSSProperties } from 'react';
import { useRouteTransition } from '../../hooks/animations/useRouteTransition';

export function RouteTransitionProgress() {
  const { durationMs, isTransitioning, phase } = useRouteTransition();

  return (
    <div
      aria-hidden="true"
      className={`route-transition-progress${isTransitioning ? ' is-active' : ''} route-transition-progress--${phase}`}
      style={{ '--route-transition-duration': `${durationMs}ms` } as CSSProperties}
    />
  );
}
