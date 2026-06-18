import { createContext, useContext } from 'react';

export type CanvasFlipTransitionOrigin = {
  x: number;
  y: number;
};

export type StartCanvasFlipRouteTransitionArgs = {
  to: string;
  sourceCanvas: HTMLCanvasElement | null;
  origin?: CanvasFlipTransitionOrigin;
  durationMs?: number;
};

export type CanvasFlipRouteTransitionContextValue = {
  startCanvasFlipRouteTransition: (args: StartCanvasFlipRouteTransitionArgs) => void;
  registerRouteTransitionCanvas: (routePath: string, canvas: HTMLCanvasElement | null) => void;
  isTransitioning: boolean;
};

export const CanvasFlipRouteTransitionContext = createContext<CanvasFlipRouteTransitionContextValue | null>(null);

export function useCanvasFlipRouteTransition() {
  const context = useContext(CanvasFlipRouteTransitionContext);

  if (!context) {
    throw new Error('useCanvasFlipRouteTransition must be used within CanvasFlipRouteTransitionProvider');
  }

  return context;
}
