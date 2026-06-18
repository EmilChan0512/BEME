import type { CanvasEffect } from './types';

type ScrollFeedbackEffectOptions = {
  // 把上一帧按多大比例缩回画面中，越小回卷感越强。
  shrink: number;
  // 残影叠加透明度，越大拖影越明显。
  alpha: number;
  // 停止滚动后，拖影需要多久才完全衰减。
  decayMs: number;
  // 低于这个滚动位移时，不触发反馈，避免轻微抖动也出现脏影。
  minDelta: number;
};

export type ScrollFeedbackEffect = {
  // 在当前帧里把“上一帧缓存”按一定缩放和透明度叠回来。
  render: CanvasEffect;
  // 在当前帧绘制结束后，把结果缓存下来，供下一帧回写使用。
  persistFrame: (canvas: HTMLCanvasElement, width: number, height: number) => void;
};

// 只在滚动时启用的反馈拖影。
// 这样既保留滚动时的流体感，又避免鼠标移动时把正文文字拖出重影。
export function createScrollFeedbackEffect(options: ScrollFeedbackEffectOptions): ScrollFeedbackEffect {
  const { shrink, alpha, decayMs, minDelta } = options;
  let feedbackCanvas: HTMLCanvasElement | null = null;
  let feedbackCtx: CanvasRenderingContext2D | null = null;
  let previousScrollTop = 0;
  let lastScrollAt = 0;
  let scrollVelocity = 0;

  const ensureFeedback = (width: number, height: number) => {
    // 用一个离屏 canvas 存上一帧，避免直接从当前预览层读写导致污染。
    if (!feedbackCanvas) {
      feedbackCanvas = document.createElement('canvas');
      feedbackCtx = feedbackCanvas.getContext('2d');
    }

    if (!feedbackCanvas || !feedbackCtx) {
      return null;
    }

    if (feedbackCanvas.width !== width || feedbackCanvas.height !== height) {
      feedbackCanvas.width = width;
      feedbackCanvas.height = height;
      feedbackCtx.setTransform(1, 0, 0, 1, 0, 0);
      feedbackCtx.clearRect(0, 0, width, height);
    }

    return { canvas: feedbackCanvas, ctx: feedbackCtx };
  };

  const render: CanvasEffect = ({ ctx, sourceRoot, time, width, height }) => {
    const feedback = ensureFeedback(width, height);

    if (!feedback) {
      return;
    }

    const currentScrollTop = sourceRoot.scrollTop;
    const scrollDelta = currentScrollTop - previousScrollTop;

    if (Math.abs(scrollDelta) > minDelta) {
      // 根据本帧滚动位移估算“滚动速度强度”。
      lastScrollAt = time;
      scrollVelocity = Math.min(1, Math.abs(scrollDelta) / 28);
    } else {
      // 不滚动时逐步衰减，不要突然断掉。
      scrollVelocity *= 0.88;
    }
    previousScrollTop = currentScrollTop;

    // scrollInfluence 既考虑瞬时滚动速度，也考虑停止后的余韵衰减。
    const decay = lastScrollAt === 0 ? 0 : Math.max(0, 1 - (time - lastScrollAt) / decayMs);
    const scrollInfluence = Math.max(scrollVelocity, decay);

    if (scrollInfluence <= 0.001) {
      // 影响已经足够小，清掉缓存，避免静止时还残留旧画面。
      feedback.ctx.setTransform(1, 0, 0, 1, 0, 0);
      feedback.ctx.clearRect(0, 0, width, height);
      return;
    }

    const ox = (1 - shrink) * width * 0.5;
    const oy = (1 - shrink) * height * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha * scrollInfluence;
    ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(shrink, 0, 0, shrink, ox, oy);
    ctx.drawImage(feedback.canvas, 0, 0);
    ctx.restore();
  };

  const persistFrame = (canvas: HTMLCanvasElement, width: number, height: number) => {
    const feedback = ensureFeedback(width, height);

    if (!feedback) {
      return;
    }

    feedback.ctx.setTransform(1, 0, 0, 1, 0, 0);
    feedback.ctx.clearRect(0, 0, width, height);
    // 当前帧渲染完成后完整拷贝下来，下一帧 render 再叠回去。
    feedback.ctx.drawImage(canvas, 0, 0, width, height);
  };

  return { render, persistFrame };
}
