import { ReactNode, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import './HtmlInCanvasStage.css';

// 实验性 html-in-canvas 能力挂在 canvas 实例上的扩展字段。
type HTMLInCanvasCanvas = HTMLCanvasElement & {
  onpaint?: ((event: Event) => void) | null;
  requestPaint?: () => void;
  layoutSubtree?: boolean;
};

// 实验性 drawElementImage / reset 可能出现在 2D context 上。
type DrawElementImageContext = CanvasRenderingContext2D & {
  reset?: () => void;
  drawElementImage?: (element: Element, dx: number, dy: number) => DOMMatrix;
};

// 预览层自定义渲染器。
// width / height 是预览层的真实像素尺寸，不是 CSS 像素。
export type HtmlInCanvasPreviewRenderer = (args: {
  ctx: CanvasRenderingContext2D;
  stagingCanvas: HTMLCanvasElement;
  sourceRoot: HTMLElement;
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
  sourceRootRef?: ((node: HTMLElement | null) => void) | MutableRefObject<HTMLElement | null>;
  previewCanvasRef?: ((node: HTMLCanvasElement | null) => void) | MutableRefObject<HTMLCanvasElement | null>;
  onPreviewFrame?: (canvas: HTMLCanvasElement) => void;
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

// 通用 html-in-canvas 舞台：
// 1. 底层 source 仍然是真实 DOM，可滚动、可输入、可访问；
// 2. staging canvas 负责捕获 DOM；
// 3. preview canvas 负责做二次渲染与特效叠加。
export function HtmlInCanvasStage({
  className,
  surfaceClassName,
  stagingCanvasClassName,
  previewCanvasClassName,
  sourceRootClassName,
  sourceRootRef: sourceRootExternalRef,
  previewCanvasRef: previewCanvasExternalRef,
  onPreviewFrame,
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

    // 同时满足 requestPaint + drawElementImage，才算真的能走 html-in-canvas 路径。
    const canUseHtmlInCanvas =
      Boolean(stagingContext) &&
      typeof stagingCanvas.requestPaint === 'function' &&
      typeof stagingContext?.drawElementImage === 'function';

    setIsSupported(canUseHtmlInCanvas);

    if (canUseHtmlInCanvas) {
      // layoutsubtree 是提案中的提示：告诉浏览器这个子树会被单独参与绘制。
      stagingCanvas.setAttribute('layoutsubtree', '');
      stagingCanvas.layoutSubtree = true;
    }

    let animationFrameId = 0;

    const requestStagePaint = () => {
      if (!canUseHtmlInCanvas) {
        return;
      }

      // 在支持实验能力时，不直接手动画，而是请求浏览器重新触发 onpaint。
      stagingCanvas.requestPaint?.();
    };

    const resizeCanvases = () => {
      const rect = stagingCanvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      // width / height 是实际绘制分辨率，所以要乘 DPR，避免高分屏发糊。
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
        // 交给外部 preset 自己定义如何把 staging canvas 重新“看一遍”。
        previewRenderer({
          ctx: previewContext,
          stagingCanvas,
          sourceRoot,
          time,
          width,
          height,
        });
        onPreviewFrame?.(previewCanvas);
        return;
      }

      previewContext.setTransform(1, 0, 0, 1, 0, 0);
      previewContext.clearRect(0, 0, width, height);
      previewContext.drawImage(stagingCanvas, 0, 0, width, height);
      onPreviewFrame?.(previewCanvas);
    };

    const paint = () => {
      if (!canUseHtmlInCanvas || !stagingContext) {
        return;
      }

      if (typeof stagingContext.reset === 'function') {
        stagingContext.reset();
      } else {
        // 老一点的实验实现没有 reset，就手动归位并清空。
        stagingContext.setTransform(1, 0, 0, 1, 0, 0);
        stagingContext.clearRect(0, 0, stagingCanvas.width, stagingCanvas.height);
      }

      // 把真实 DOM 直接绘制进 staging canvas。
      const transform = stagingContext.drawElementImage?.(sourceRoot, 0, 0);

      if (transform) {
        // 某些实现会返回 DOM 需要补上的 transform，用于保持视觉位置一致。
        sourceRoot.style.transform = transform.toString();
      }

      renderPreview(performance.now());
    };

    const animate = (time: number) => {
      // fallback 模式下没有 onpaint，就持续驱动 previewRenderer。
      renderPreview(time);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(() => resizeCanvases());
    resizeObserver.observe(stagingCanvas);

    if (canUseHtmlInCanvas) {
      stagingCanvas.onpaint = paint;
    }

    // sourceRoot 发生滚动、输入、键盘等交互时，请求重新捕获 DOM。
    for (const eventName of repaintEvents) {
      sourceRoot.addEventListener(eventName, requestStagePaint, { passive: eventName === 'scroll' });
    }

    resizeCanvases();

    // 预览层依赖 staging canvas 捕获到真实 DOM。
    // 在不支持 html-in-canvas 的浏览器里继续驱动 preview，
    // 只会得到一层空白/特效底板，反而把 fallback 内容盖住。
    if (canUseHtmlInCanvas && previewRenderer) {
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
  }, [onPreviewFrame, previewRenderer, repaintEvents]);

  // preview 依赖 html-in-canvas 捕获结果；不支持时直接展示真实 DOM fallback。
  const shouldShowPreview = isSupported;

  const setPreviewCanvasRef = (node: HTMLCanvasElement | null) => {
    previewCanvasRef.current = node;

    if (!previewCanvasExternalRef) {
      return;
    }

    if (typeof previewCanvasExternalRef === 'function') {
      previewCanvasExternalRef(node);
      return;
    }

    previewCanvasExternalRef.current = node;
  };

  const setSourceRootRef = (node: HTMLElement | null) => {
    sourceRootRef.current = node;

    if (!sourceRootExternalRef) {
      return;
    }

    if (typeof sourceRootExternalRef === 'function') {
      sourceRootExternalRef(node);
      return;
    }

    sourceRootExternalRef.current = node;
  };

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
            ref={setSourceRootRef}
            className={sourceRootClassName ? `hic-source-root ${sourceRootClassName}` : 'hic-source-root'}
          >
            {source}
          </section>
        </canvas>

        <canvas
          ref={setPreviewCanvasRef}
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
