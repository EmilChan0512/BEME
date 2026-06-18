import { ReactNode, useEffect, useRef, useState } from 'react';
import './HtmlInCanvasStage.css';

type HTMLInCanvasCanvas = HTMLCanvasElement & {
  onpaint?: ((event: Event) => void) | null;
  requestPaint?: () => void;
  layoutSubtree?: boolean;
};

type DrawElementImageContext = CanvasRenderingContext2D & {
  reset?: () => void;
  drawElementImage?: (element: Element, dx: number, dy: number) => DOMMatrix;
};

export type HtmlInCanvasPreviewRenderer = (args: {
  ctx: CanvasRenderingContext2D;
  stagingCanvas: HTMLCanvasElement;
  time: number;
  width: number;
  height: number;
}) => void;

export type HtmlInCanvasStageProps = {
  className?: string;
  surfaceClassName?: string;
  stagingCanvasClassName?: string;
  previewCanvasClassName?: string;
  sourceRootClassName?: string;
  source: ReactNode;
  fallback?: ReactNode;
  previewRenderer?: HtmlInCanvasPreviewRenderer;
  repaintEvents?: Array<
    | 'scroll'
    | 'input'
    | 'change'
    | 'focusin'
    | 'focusout'
    | 'pointerdown'
    | 'pointerup'
    | 'keydown'
    | 'keyup'
  >;
};

export function HtmlInCanvasStage({
  className,
  surfaceClassName,
  stagingCanvasClassName,
  previewCanvasClassName,
  sourceRootClassName,
  source,
  fallback,
  previewRenderer,
  repaintEvents = ['scroll', 'input', 'change', 'focusin', 'pointerup', 'keydown'],
}: HtmlInCanvasStageProps) {
  const stagingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceRootRef = useRef<HTMLElement | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const stagingCanvas = stagingCanvasRef.current as HTMLInCanvasCanvas | null;
    const previewCanvas = previewCanvasRef.current;
    const sourceRoot = sourceRootRef.current;

    if (!stagingCanvas || !previewCanvas || !sourceRoot) {
      setIsSupported(false);
      return;
    }

    const stagingContext = stagingCanvas.getContext('2d') as DrawElementImageContext | null;
    const previewContext = previewCanvas.getContext('2d');

    if (!previewContext) {
      setIsSupported(false);
      return;
    }

    const canUseHtmlInCanvas =
      Boolean(stagingContext) &&
      typeof stagingCanvas.requestPaint === 'function' &&
      typeof stagingContext?.drawElementImage === 'function';

    setIsSupported(canUseHtmlInCanvas);

    if (canUseHtmlInCanvas) {
      stagingCanvas.setAttribute('layoutsubtree', '');
      stagingCanvas.layoutSubtree = true;
    }

    let animationFrameId = 0;

    const requestStagePaint = () => {
      if (!canUseHtmlInCanvas) {
        return;
      }

      stagingCanvas.requestPaint?.();
    };

    const resizeCanvases = () => {
      const rect = stagingCanvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));

      stagingCanvas.width = width;
      stagingCanvas.height = height;
      previewCanvas.width = width;
      previewCanvas.height = height;

      if (canUseHtmlInCanvas) {
        requestStagePaint();
      } else {
        renderPreview(performance.now());
      }
    };

    const renderPreview = (time: number) => {
      const width = previewCanvas.width;
      const height = previewCanvas.height;

      if (previewRenderer) {
        previewRenderer({
          ctx: previewContext,
          stagingCanvas,
          time,
          width,
          height,
        });
        return;
      }

      previewContext.setTransform(1, 0, 0, 1, 0, 0);
      previewContext.clearRect(0, 0, width, height);
      previewContext.drawImage(stagingCanvas, 0, 0, width, height);
    };

    const paint = () => {
      if (!canUseHtmlInCanvas || !stagingContext) {
        return;
      }

      if (typeof stagingContext.reset === 'function') {
        stagingContext.reset();
      } else {
        stagingContext.setTransform(1, 0, 0, 1, 0, 0);
        stagingContext.clearRect(0, 0, stagingCanvas.width, stagingCanvas.height);
      }

      const transform = stagingContext.drawElementImage?.(sourceRoot, 0, 0);

      if (transform) {
        sourceRoot.style.transform = transform.toString();
      }

      renderPreview(performance.now());
    };

    const animate = (time: number) => {
      renderPreview(time);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(() => resizeCanvases());
    resizeObserver.observe(stagingCanvas);

    if (canUseHtmlInCanvas) {
      stagingCanvas.onpaint = paint;
    }

    for (const eventName of repaintEvents) {
      sourceRoot.addEventListener(eventName, requestStagePaint, { passive: eventName === 'scroll' });
    }

    resizeCanvases();

    // Even when html-in-canvas isn't available, keep the preview alive if a custom renderer is
    // provided. This makes presets visibly "do something" in non-flag browsers too.
    if (previewRenderer) {
      animationFrameId = window.requestAnimationFrame(animate);
    }

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrameId);
      stagingCanvas.onpaint = null;
      for (const eventName of repaintEvents) {
        sourceRoot.removeEventListener(eventName, requestStagePaint);
      }
      sourceRoot.style.transform = '';
    };
  }, [previewRenderer, repaintEvents]);

  const shouldShowPreview = isSupported || Boolean(previewRenderer);

  return (
    <section className={className ? `hic-stage ${className}` : 'hic-stage'}>
      <div className={surfaceClassName ? `hic-surface ${surfaceClassName}` : 'hic-surface'}>
        <canvas
          ref={stagingCanvasRef}
          className={
            isSupported
              ? stagingCanvasClassName
                ? `hic-staging ${stagingCanvasClassName}`
                : 'hic-staging'
              : stagingCanvasClassName
                ? `hic-staging hic-staging--hidden ${stagingCanvasClassName}`
                : 'hic-staging hic-staging--hidden'
          }
          aria-label="html-in-canvas staging surface"
        >
          <section
            ref={sourceRootRef}
            className={sourceRootClassName ? `hic-source-root ${sourceRootClassName}` : 'hic-source-root'}
          >
            {source}
          </section>
        </canvas>

        <canvas
          ref={previewCanvasRef}
          className={
            shouldShowPreview
              ? previewCanvasClassName
                ? `hic-preview ${previewCanvasClassName}`
                : 'hic-preview'
              : previewCanvasClassName
                ? `hic-preview hic-preview--hidden ${previewCanvasClassName}`
                : 'hic-preview hic-preview--hidden'
          }
          aria-hidden="true"
        />

        {isSupported ? null : <div className="hic-fallback">{fallback ?? source}</div>}
      </div>
    </section>
  );
}
