import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Location } from 'react-router-dom';
import {
  RouteTransitionContext,
  type RouteTransitionEffectName,
  type RouteTransitionSnapshot,
} from '../../hooks/animations/useRouteTransition';
import { usePrefersReducedMotion } from '../../hooks/animations/usePrefersReducedMotion';

type ResolveRouteTransitionEffectArgs = {
  from: Location;
  to: Location;
  cycle: number;
};

type RouteTransitionProviderProps = {
  location: Location;
  children: (displayLocation: Location) => ReactNode;
  durationMs?: number;
  resolveEffect?: (args: ResolveRouteTransitionEffectArgs) => RouteTransitionEffectName;
};

const DEFAULT_DURATION_MS = 900;

function getIsSameLocation(left: Location, right: Location) {
  return (
    left.pathname === right.pathname &&
    left.search === right.search &&
    left.hash === right.hash &&
    left.key === right.key
  );
}

function getShouldSkipTransition(location: Location) {
  return Boolean((location.state as { skipRouteTransition?: boolean } | null)?.skipRouteTransition);
}

function getDefaultEffect({
  from,
  to,
  cycle,
}: ResolveRouteTransitionEffectArgs): RouteTransitionEffectName {
  const isSectionChange = from.pathname.split('/')[1] !== to.pathname.split('/')[1];
  return isSectionChange || cycle % 2 === 0 ? 'curtain' : 'grid';
}

export function RouteTransitionProvider({
  location,
  children,
  durationMs = DEFAULT_DURATION_MS,
  resolveEffect = getDefaultEffect,
}: RouteTransitionProviderProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayLocation, setDisplayLocation] = useState(location);
  const cycleRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const coveringDurationMs = useMemo(() => Math.max(240, Math.round(durationMs * 0.52)), [durationMs]);
  const [snapshot, setSnapshot] = useState<RouteTransitionSnapshot>({
    effect: 'curtain',
    phase: 'idle',
    isTransitioning: false,
    displayLocation: location,
    currentPath: location.pathname,
    previousPath: null,
    nextPath: null,
    durationMs,
    coveringDurationMs,
    cycle: 0,
  });

  useEffect(() => {
    setSnapshot((current) => ({
      ...current,
      displayLocation,
      currentPath: displayLocation.pathname,
      durationMs,
      coveringDurationMs,
    }));
  }, [coveringDurationMs, displayLocation, durationMs]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      setDisplayLocation(location);
      setSnapshot((current) => ({
        ...current,
        phase: 'idle',
        isTransitioning: false,
        displayLocation: location,
        currentPath: location.pathname,
        previousPath: null,
        nextPath: null,
        durationMs,
        coveringDurationMs,
      }));
      return;
    }

    if (getIsSameLocation(displayLocation, location)) {
      return;
    }

    if (getShouldSkipTransition(location)) {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      setDisplayLocation(location);
      setSnapshot((current) => ({
        ...current,
        phase: 'idle',
        isTransitioning: false,
        displayLocation: location,
        currentPath: location.pathname,
        previousPath: null,
        nextPath: null,
        durationMs,
        coveringDurationMs,
      }));
      return;
    }

    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    cycleRef.current += 1;

    const cycle = cycleRef.current;
    const fromLocation = displayLocation;
    const toLocation = location;
    const effect = resolveEffect({ from: fromLocation, to: toLocation, cycle });

    setSnapshot({
      effect,
      phase: 'covering',
      isTransitioning: true,
      displayLocation: fromLocation,
      currentPath: fromLocation.pathname,
      previousPath: fromLocation.pathname,
      nextPath: toLocation.pathname,
      durationMs,
      coveringDurationMs,
      cycle,
    });

    const coveringTimer = window.setTimeout(() => {
      setDisplayLocation(toLocation);
      setSnapshot((current) => ({
        ...current,
        phase: 'revealing',
        displayLocation: toLocation,
        currentPath: toLocation.pathname,
      }));
    }, coveringDurationMs);

    const finishTimer = window.setTimeout(() => {
      setSnapshot((current) => ({
        ...current,
        phase: 'idle',
        isTransitioning: false,
        displayLocation: toLocation,
        currentPath: toLocation.pathname,
        previousPath: null,
        nextPath: null,
      }));
    }, durationMs);

    timersRef.current = [coveringTimer, finishTimer];
  }, [coveringDurationMs, displayLocation, durationMs, location, prefersReducedMotion, resolveEffect]);

  return (
    <RouteTransitionContext.Provider value={snapshot}>
      {children(displayLocation)}
    </RouteTransitionContext.Provider>
  );
}
