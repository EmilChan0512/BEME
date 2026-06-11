import { createContext, useContext } from 'react';
import type { Location } from 'react-router-dom';

export type RouteTransitionPhase = 'idle' | 'covering' | 'revealing';
export type RouteTransitionEffectName = 'curtain' | 'grid';

export type RouteTransitionSnapshot = {
  effect: RouteTransitionEffectName;
  phase: RouteTransitionPhase;
  isTransitioning: boolean;
  displayLocation: Location;
  currentPath: string;
  previousPath: string | null;
  nextPath: string | null;
  durationMs: number;
  coveringDurationMs: number;
  cycle: number;
};

export const RouteTransitionContext = createContext<RouteTransitionSnapshot | null>(null);

export function useRouteTransition() {
  const context = useContext(RouteTransitionContext);

  if (!context) {
    throw new Error('useRouteTransition must be used within RouteTransitionProvider');
  }

  return context;
}
