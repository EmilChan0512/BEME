import { useEffect, useMemo, useRef, useState } from 'react';

type AuroraCanvasActionMenuProps = {
  disabled?: boolean;
  onReturnHome: (sourceElement: HTMLElement) => void;
  onScrollToTop: () => void;
};

type MenuAction = {
  id: 'home' | 'top';
  ariaLabel: string;
  onSelect: (sourceElement: HTMLCanvasElement) => void;
};

export function AuroraCanvasActionMenu({
  disabled = false,
  onReturnHome,
  onScrollToTop,
}: AuroraCanvasActionMenuProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLCanvasElement | null>(null);
  const actionRefs = useRef<Record<MenuAction['id'], HTMLCanvasElement | null>>({
    home: null,
    top: null,
  });
  const hoverTargetRef = useRef<'trigger' | MenuAction['id'] | null>(null);
  const pressedTargetRef = useRef<'trigger' | MenuAction['id'] | null>(null);
  const menuProgressRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);

  const actions = useMemo<MenuAction[]>(
    () => [
      {
        id: 'home',
        ariaLabel: 'Back home',
        onSelect: (sourceElement) => {
          onReturnHome(sourceElement);
        },
      },
      {
        id: 'top',
        ariaLabel: 'Scroll to top',
        onSelect: () => {
          onScrollToTop();
        },
      },
    ],
    [onReturnHome, onScrollToTop],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  useEffect(() => {
    const renderCanvas = (
      canvas: HTMLCanvasElement,
      width: number,
      height: number,
      draw: (context: CanvasRenderingContext2D) => void,
    ) => {
      const context = canvas.getContext('2d');

      if (!context) {
        return;
      }

      const ratio = window.devicePixelRatio || 1;
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(ratio, ratio);
      context.clearRect(0, 0, width, height);
      draw(context);
    };

    let frameId = 0;

    const render = (time: number) => {
      menuProgressRef.current += (Number(isOpen) - menuProgressRef.current) * 0.16;
      const menuProgress = menuProgressRef.current;

      const triggerCanvas = triggerRef.current;
      if (triggerCanvas) {
        renderCanvas(triggerCanvas, 64, 64, (context) => {
          const isHovered = hoverTargetRef.current === 'trigger';
          const isPressed = pressedTargetRef.current === 'trigger';
          drawTriggerButton(context, {
            time,
            menuProgress,
            hovered: isHovered,
            pressed: isPressed,
            disabled,
          });
        });
      }

      for (const action of actions) {
        const actionCanvas = actionRefs.current[action.id];

        if (!actionCanvas) {
          continue;
        }

        renderCanvas(actionCanvas, 52, 52, (context) => {
          const isHovered = hoverTargetRef.current === action.id;
          const isPressed = pressedTargetRef.current === action.id;
          drawMenuItem(context, {
            itemId: action.id,
            menuProgress,
            hovered: isHovered,
            pressed: isPressed,
          });
        });
      }

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [actions, disabled, isOpen]);

  const handleTriggerToggle = () => {
    if (disabled) {
      return;
    }

    setIsOpen((current) => !current);
  };

  const handleActionSelect = (action: MenuAction, canvas: HTMLCanvasElement | null) => {
    if (!canvas || disabled) {
      return;
    }

    action.onSelect(canvas);
    setIsOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`aurora-source__menu${isOpen ? ' aurora-source__menu--open' : ''}`}
      data-open={isOpen}
    >
      <canvas
        ref={triggerRef}
        className="aurora-source__menu-trigger"
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Collapse action menu' : 'Open action menu'}
        onClick={handleTriggerToggle}
        onPointerEnter={() => {
          hoverTargetRef.current = 'trigger';
        }}
        onPointerLeave={() => {
          if (hoverTargetRef.current === 'trigger') {
            hoverTargetRef.current = null;
          }
          if (pressedTargetRef.current === 'trigger') {
            pressedTargetRef.current = null;
          }
        }}
        onPointerDown={() => {
          pressedTargetRef.current = 'trigger';
        }}
        onPointerUp={() => {
          if (pressedTargetRef.current === 'trigger') {
            pressedTargetRef.current = null;
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleTriggerToggle();
          }

          if (event.key === 'ArrowDown' && !isOpen) {
            event.preventDefault();
            setIsOpen(true);
          }

          if (event.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      />

      <div className="aurora-source__menu-panel" role="menu" aria-hidden={!isOpen}>
        {actions.map((action, index) => (
          <canvas
            key={action.id}
            ref={(node) => {
              actionRefs.current[action.id] = node;
            }}
            className="aurora-source__menu-item"
            role="menuitem"
            tabIndex={isOpen ? 0 : -1}
            aria-label={action.ariaLabel}
            style={
              {
                '--menu-item-index': index,
              } as React.CSSProperties
            }
            onClick={() => {
              handleActionSelect(action, actionRefs.current[action.id]);
            }}
            onPointerEnter={() => {
              hoverTargetRef.current = action.id;
            }}
            onPointerLeave={() => {
              if (hoverTargetRef.current === action.id) {
                hoverTargetRef.current = null;
              }
              if (pressedTargetRef.current === action.id) {
                pressedTargetRef.current = null;
              }
            }}
            onPointerDown={() => {
              pressedTargetRef.current = action.id;
            }}
            onPointerUp={() => {
              if (pressedTargetRef.current === action.id) {
                pressedTargetRef.current = null;
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleActionSelect(action, actionRefs.current[action.id]);
              }

              if (event.key === 'Escape') {
                event.preventDefault();
                setIsOpen(false);
                triggerRef.current?.focus();
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

function drawTriggerButton(
  ctx: CanvasRenderingContext2D,
  args: {
    time: number;
    menuProgress: number;
    hovered: boolean;
    pressed: boolean;
    disabled: boolean;
  },
) {
  const { menuProgress, hovered, pressed, disabled } = args;
  const width = 56;
  const height = 56;
  const hoverProgress = hovered ? 1 : 0;
  const pressedScale = pressed ? 0.96 : 1;
  const iconAlpha = disabled ? 0.26 : mixNumber(0.68, 1, hoverProgress * 0.8 + menuProgress * 0.2);

  ctx.save();
  ctx.translate(width * 0.5, height * 0.5);
  ctx.scale(pressedScale, pressedScale);
  ctx.translate(-width * 0.5, -height * 0.5);

  ctx.save();
  ctx.translate(width * 0.5, height * 0.5);
  ctx.rotate(menuProgress * Math.PI * 0.25);
  ctx.translate(-width * 0.5, -height * 0.5);
  ctx.globalAlpha = iconAlpha;
  ctx.strokeStyle = '#111111';
  ctx.lineCap = 'round';
  ctx.lineWidth = mixNumber(1.8, 2.2, hoverProgress);
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const lineWidth = 16;
  const middleShift = mixNumber(0, 5, menuProgress);
  const alphaFade = 1 - menuProgress;
  drawLine(ctx, centerX - lineWidth * 0.5, centerY - 8, centerX + lineWidth * 0.5, centerY - 8);
  ctx.save();
  ctx.globalAlpha = alphaFade;
  drawLine(ctx, centerX - lineWidth * 0.5, centerY, centerX + lineWidth * 0.5, centerY);
  ctx.restore();
  drawLine(
    ctx,
    centerX - lineWidth * 0.5 + middleShift * 0.4,
    centerY + 8,
    centerX + lineWidth * 0.5 - middleShift,
    centerY + 8,
  );
  ctx.restore();

  ctx.restore();
}

function drawMenuItem(
  ctx: CanvasRenderingContext2D,
  args: {
    itemId: MenuAction['id'];
    menuProgress: number;
    hovered: boolean;
    pressed: boolean;
  },
) {
  const { itemId, menuProgress, hovered, pressed } = args;
  const width = 52;
  const height = 52;
  const hoverProgress = hovered ? 1 : 0;
  const pressedScale = pressed ? 0.95 : 1;
  const iconAlpha = mixNumber(0.62, 1, hoverProgress * 0.85 + menuProgress * 0.15);

  ctx.save();
  ctx.translate(width * 0.5, height * 0.5);
  ctx.scale(pressedScale, pressedScale);
  ctx.translate(-width * 0.5, -height * 0.5);

  ctx.save();
  ctx.translate(width * 0.5, height * 0.5);
  ctx.globalAlpha = iconAlpha;
  ctx.strokeStyle = '#111111';
  ctx.fillStyle = '#111111';
  ctx.lineWidth = mixNumber(1.7, 2.1, hoverProgress);
  ctx.lineCap = 'round';

  if (itemId === 'home') {
    drawHomeIcon(ctx, hoverProgress);
  } else {
    drawTopIcon(ctx, hoverProgress);
  }
  ctx.restore();

  ctx.restore();
}

function drawHomeIcon(ctx: CanvasRenderingContext2D, hoverProgress: number) {
  const roofLift = mixNumber(0, -1.2, hoverProgress);
  const bodyLift = mixNumber(0, -0.8, hoverProgress);
  ctx.beginPath();
  ctx.moveTo(-8, 2.5 + roofLift);
  ctx.lineTo(0, -5.5 + roofLift);
  ctx.lineTo(8, 2.5 + roofLift);
  ctx.stroke();

  strokeRoundedRect(ctx, -6.5, 2.5 + bodyLift, 13, 11, 3.4);

  ctx.beginPath();
  ctx.moveTo(-1.6, 13 + bodyLift);
  ctx.lineTo(-1.6, 8.4 + bodyLift);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(1.6, 13 + bodyLift);
  ctx.lineTo(1.6, 8.4 + bodyLift);
  ctx.stroke();
}

function drawTopIcon(ctx: CanvasRenderingContext2D, hoverProgress: number) {
  const lift = mixNumber(0, -2.2, hoverProgress);
  const baseLift = mixNumber(0, -0.6, hoverProgress);
  ctx.beginPath();
  ctx.moveTo(0, -7.5 + lift);
  ctx.lineTo(0, 5.5 + lift);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-5.5, -1.5 + lift);
  ctx.lineTo(0, -7.5 + lift);
  ctx.lineTo(5.5, -1.5 + lift);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-6.5, 9 + baseLift);
  ctx.lineTo(6.5, 9 + baseLift);
  ctx.stroke();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
}

function mixNumber(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width * 0.5, height * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.stroke();
}
