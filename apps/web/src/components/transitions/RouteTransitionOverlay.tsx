import type { CSSProperties } from 'react';
import { useRouteTransition } from '../../hooks/animations/useRouteTransition';

function CurtainEffect() {
  return (
    <div className="route-transition__curtain">
      <span className="route-transition__panel" />
      <span className="route-transition__panel" />
      <span className="route-transition__panel" />
    </div>
  );
}

function GridEffect() {
  return (
    <div className="route-transition__grid">
      {Array.from({ length: 16 }).map((_, index) => (
        <span
          key={index}
          className="route-transition__cell"
          style={{ '--cell-index': index } as CSSProperties}
        />
      ))}
    </div>
  );
}

export function RouteTransitionOverlay() {
  const { cycle, durationMs, effect, isTransitioning, phase } = useRouteTransition();

  if (!isTransitioning) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`route-transition route-transition--${phase}`}
      style={
        {
          '--route-transition-duration': `${durationMs}ms`,
          '--route-transition-cycle': cycle,
        } as CSSProperties
      }
    >
      <div className="route-transition__backdrop" />
      {effect === 'curtain' ? <CurtainEffect /> : <GridEffect />}
    </div>
  );
}
