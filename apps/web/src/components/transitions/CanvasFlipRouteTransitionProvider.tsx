import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePrefersReducedMotion } from '../../hooks/animations/usePrefersReducedMotion';
import {
  CanvasFlipRouteTransitionContext,
  type CanvasFlipTransitionOrigin,
  type StartCanvasFlipRouteTransitionArgs,
} from '../../hooks/animations/useCanvasFlipRouteTransition';

type CanvasFlipTransitionSnapshot = {
  id: number;
  sourceTextureCanvas: HTMLCanvasElement;
  targetTextureCanvas: HTMLCanvasElement | null;
  targetCapturedAt: number | null;
  durationMs: number;
  navigateAtMs: number;
  revealStartAtMs: number;
  origin: CanvasFlipTransitionOrigin;
  rows: number;
  cols: number;
  startedAt: number;
  from: string;
  to: string;
};

type CanvasFlipRouteTransitionProviderProps = {
  children: ReactNode;
};

type CanvasFlipOverlayProps = {
  transition: CanvasFlipTransitionSnapshot | null;
  onNavigate: (transition: CanvasFlipTransitionSnapshot) => void;
  onFinish: (transitionId: number) => void;
};

const DEFAULT_DURATION_MS = 1220;
const DEFAULT_ROWS = 6;
const DEFAULT_COLS = 10;
const DEFAULT_NAVIGATE_RATIO = 0.24;
const DEFAULT_REVEAL_RATIO = 0.62;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeInOutCubic(value: number) {
  if (value < 0.5) {
    return 4 * value * value * value;
  }

  return 1 - (-2 * value + 2) ** 3 / 2;
}

function easeOutQuad(value: number) {
  return 1 - (1 - value) * (1 - value);
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

function cloneCanvas(sourceCanvas: HTMLCanvasElement) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = sourceCanvas.width;
  textureCanvas.height = sourceCanvas.height;
  const textureContext = textureCanvas.getContext('2d');

  if (!textureContext) {
    return null;
  }

  textureContext.drawImage(sourceCanvas, 0, 0, textureCanvas.width, textureCanvas.height);
  return textureCanvas;
}

function getTileDelay(
  row: number,
  col: number,
  rows: number,
  cols: number,
  origin: CanvasFlipTransitionOrigin,
) {
  const tileX = (col + 0.5) / cols;
  const tileY = (row + 0.5) / rows;
  const dx = tileX - origin.x;
  const dy = tileY - origin.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return Math.min(0.34, distance * 0.5);
}

function drawTransitionBackdrop(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  ctx.save();
  const alpha = clamp(intensity, 0, 1);
  const background = ctx.createLinearGradient(0, 0, width, height);
  // 背景层始终保持不透明，防止底下真实页面在切片缝隙里露出来。
  background.addColorStop(0, 'rgba(7, 11, 26, 1)');
  background.addColorStop(0.55, 'rgba(17, 24, 39, 1)');
  background.addColorStop(1, 'rgba(14, 22, 44, 1)');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = `rgba(123, 214, 255, ${0.08 * alpha})`;
  ctx.lineWidth = 1;
  const step = Math.max(24, Math.round(width / 18));
  for (let x = -height; x < width + height; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x + height * 0.68, 0);
    ctx.stroke();
  }

  ctx.restore();
}

function drawOutgoingTransitionFrame(
  ctx: CanvasRenderingContext2D,
  transition: CanvasFlipTransitionSnapshot,
  progress: number,
  width: number,
  height: number,
) {
  const { cols, origin, rows, sourceTextureCanvas } = transition;
  const tileWidth = width / cols;
  const tileHeight = height / rows;
  const sourceTileWidth = sourceTextureCanvas.width / cols;
  const sourceTileHeight = sourceTextureCanvas.height / rows;

  drawTransitionBackdrop(ctx, width, height, 1);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const delay = getTileDelay(row, col, rows, cols, origin) * 0.88;
      const localProgress = clamp((progress - delay) / (1 - delay), 0, 1);

      if (localProgress <= 0) {
        ctx.drawImage(
          sourceTextureCanvas,
          col * sourceTileWidth,
          row * sourceTileHeight,
          sourceTileWidth,
          sourceTileHeight,
          col * tileWidth,
          row * tileHeight,
          tileWidth,
          tileHeight,
        );
        continue;
      }

      const tileX = (col + 0.5) / cols;
      const tileY = (row + 0.5) / rows;
      const dx = tileX - origin.x;
      const dy = tileY - origin.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const directionX = dx === 0 ? 0 : dx / Math.abs(dx);
      const directionY = dy === 0 ? -1 : dy / Math.abs(dy);
      const lift = easeOutCubic(localProgress);
      const flip = easeInOutCubic(clamp((localProgress - 0.04) / 0.96, 0, 1));
      const angle = flip * Math.PI * 1.08;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const depth = Math.sin(Math.min(Math.PI * 0.5, flip * Math.PI * 0.78));
      const flipScaleX = Math.max(0.02, Math.abs(cos));
      const isBackFaceVisible = cos < 0;
      const flipScaleY = 1 - 0.18 * depth;
      const tileCenterX = (col + 0.5) * tileWidth;
      const tileCenterY = (row + 0.5) * tileHeight;
      const swirlDirection = (row + col) % 2 === 0 ? 1 : -1;
      const xOffset =
        directionX * lift * width * (0.03 + distance * 0.18) + swirlDirection * sin * tileWidth * 0.2;
      const yOffset =
        directionY * lift * height * 0.035 - easeOutQuad(localProgress) * height * (0.08 + distance * 0.08);
      const rotate = swirlDirection * sin * 0.22 + directionX * lift * 0.1;
      const opacity = 1 - clamp((localProgress - 0.34) / 0.66, 0, 1);
      const shadeAlpha = 0.16 + 0.42 * depth;
      const edgeGlowAlpha = 0.2 * (1 - localProgress);
      const shadowAlpha = 0.22 * (1 - localProgress * 0.7);

      if (opacity <= 0.01) {
        continue;
      }

      ctx.save();
      ctx.translate(tileCenterX + xOffset, tileCenterY + yOffset);
      ctx.rotate(rotate);
      ctx.scale(flipScaleX, flipScaleY);
      ctx.shadowColor = `rgba(109, 217, 255, ${shadowAlpha})`;
      ctx.shadowBlur = 22 * depth + 6;
      ctx.shadowOffsetY = 14 * lift;
      ctx.globalAlpha = opacity;
      if (isBackFaceVisible) {
        const backFace = ctx.createLinearGradient(-tileWidth * 0.5, -tileHeight * 0.5, tileWidth * 0.5, tileHeight * 0.5);
        backFace.addColorStop(0, `rgba(166, 172, 184, ${opacity})`);
        backFace.addColorStop(0.48, `rgba(122, 128, 140, ${opacity})`);
        backFace.addColorStop(1, `rgba(84, 90, 104, ${opacity})`);
        ctx.fillStyle = backFace;
        ctx.fillRect(-tileWidth * 0.5, -tileHeight * 0.5, tileWidth, tileHeight);

        ctx.fillStyle = `rgba(48, 54, 66, ${0.24 + shadeAlpha * 0.68})`;
        ctx.fillRect(-tileWidth * 0.5, -tileHeight * 0.5, tileWidth, tileHeight);
      } else {
        ctx.drawImage(
          sourceTextureCanvas,
          col * sourceTileWidth,
          row * sourceTileHeight,
          sourceTileWidth,
          sourceTileHeight,
          -tileWidth * 0.5,
          -tileHeight * 0.5,
          tileWidth,
          tileHeight,
        );

        ctx.fillStyle = `rgba(5, 9, 24, ${shadeAlpha * opacity})`;
        ctx.fillRect(-tileWidth * 0.5, -tileHeight * 0.5, tileWidth, tileHeight);
      }

      ctx.strokeStyle = isBackFaceVisible
        ? `rgba(228, 235, 244, ${0.14 + edgeGlowAlpha * 0.5})`
        : `rgba(166, 237, 255, ${edgeGlowAlpha})`;
      ctx.lineWidth = 1.1;
      ctx.strokeRect(-tileWidth * 0.5, -tileHeight * 0.5, tileWidth, tileHeight);
      ctx.restore();
    }
  }
}

function CanvasFlipTransitionOverlay({ transition, onNavigate, onFinish }: CanvasFlipOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!transition) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    let animationFrameId = 0;
    let hasNavigated = false;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(window.innerWidth * ratio));
      canvas.height = Math.max(1, Math.round(window.innerHeight * ratio));
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
    };

    const render = (now: number) => {
      const elapsed = now - transition.startedAt;
      if (!hasNavigated && elapsed >= transition.navigateAtMs) {
        hasNavigated = true;
        onNavigate(transition);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const progress = clamp(elapsed / transition.durationMs, 0, 1);
      drawOutgoingTransitionFrame(ctx, transition, progress, window.innerWidth, window.innerHeight);

      if (progress >= 1) {
        onFinish(transition.id);
        return;
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [onFinish, onNavigate, transition]);

  if (!transition) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
      }}
    />
  );
}

export function CanvasFlipRouteTransitionProvider({ children }: CanvasFlipRouteTransitionProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [transition, setTransition] = useState<CanvasFlipTransitionSnapshot | null>(null);
  const routeCanvasRegistryRef = useRef<Record<string, HTMLCanvasElement | null>>({});

  const registerRouteTransitionCanvas = useCallback(
    (routePath: string, canvas: HTMLCanvasElement | null) => {
      routeCanvasRegistryRef.current[routePath] = canvas;

      if (!canvas) {
        return;
      }

      setTransition((current) => {
        if (
          !current ||
          current.targetTextureCanvas ||
          current.to !== routePath ||
          location.pathname !== routePath
        ) {
          return current;
        }

        const targetTextureCanvas = cloneCanvas(canvas);

        if (!targetTextureCanvas) {
          return current;
        }

        return {
          ...current,
          targetTextureCanvas,
          targetCapturedAt: performance.now(),
        };
      });
    },
    [location.pathname],
  );

  const startCanvasFlipRouteTransition = useCallback(
    ({ durationMs = DEFAULT_DURATION_MS, origin, sourceCanvas, to }: StartCanvasFlipRouteTransitionArgs) => {
      if (prefersReducedMotion || !sourceCanvas) {
        navigate(to, {
          state: {
            skipRouteTransition: true,
            canvasFlipFrom: location.pathname,
          },
        });
        return;
      }

      const textureCanvas = cloneCanvas(sourceCanvas);

      if (!textureCanvas) {
        navigate(to, { state: { skipRouteTransition: true } });
        return;
      }

      setTransition({
        id: Date.now(),
        sourceTextureCanvas: textureCanvas,
        targetTextureCanvas: null,
        targetCapturedAt: null,
        durationMs,
        navigateAtMs: Math.round(durationMs * DEFAULT_NAVIGATE_RATIO),
        revealStartAtMs: Math.round(durationMs * DEFAULT_REVEAL_RATIO),
        origin: origin ?? { x: 0.5, y: 0.5 },
        rows: DEFAULT_ROWS,
        cols: DEFAULT_COLS,
        startedAt: performance.now(),
        from: location.pathname,
        to,
      });
    },
    [location.pathname, navigate, prefersReducedMotion],
  );

  useEffect(() => {
    if (!transition) {
      return;
    }

    if (location.pathname !== transition.to || transition.targetTextureCanvas) {
      return;
    }

    const registeredCanvas = routeCanvasRegistryRef.current[transition.to];

    if (!registeredCanvas) {
      return;
    }

    const targetTextureCanvas = cloneCanvas(registeredCanvas);

    if (!targetTextureCanvas) {
      return;
    }

    setTransition((current) => {
      if (!current || current.id !== transition.id || current.targetTextureCanvas) {
        return current;
      }

      return {
        ...current,
        targetTextureCanvas,
        targetCapturedAt: performance.now(),
      };
    });
  }, [location.pathname, transition]);

  const handleNavigate = useCallback(
    (activeTransition: CanvasFlipTransitionSnapshot) => {
      navigate(activeTransition.to, {
        state: {
          skipRouteTransition: true,
          canvasFlipFrom: activeTransition.from,
        },
      });
    },
    [navigate],
  );

  const handleFinish = useCallback((transitionId: number) => {
    setTransition((current) => {
      if (!current || current.id !== transitionId) {
        return current;
      }

      return null;
    });
  }, []);

  return (
    <CanvasFlipRouteTransitionContext.Provider
      value={{
        startCanvasFlipRouteTransition,
        registerRouteTransitionCanvas,
        isTransitioning: Boolean(transition),
      }}
    >
      {children}
      <CanvasFlipTransitionOverlay
        transition={transition}
        onNavigate={handleNavigate}
        onFinish={handleFinish}
      />
    </CanvasFlipRouteTransitionContext.Provider>
  );
}
