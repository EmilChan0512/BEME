import type { CanvasEffect } from './types';

type ScrollChromaticEffectOptions = {
  // 基础偏移量，决定彩边最少会分开多少。
  shiftBase: number;
  // 滚动越快时，额外增加多少像素偏移。
  shiftSpeedBoost: number;
  // 给偏移再叠一层轻微脉冲，让分色不至于过死。
  shiftPulseBoost: number;
  // 整体彩边透明度。
  alpha: number;
  // 停止滚动后，色散需要多久淡出。
  decayMs: number;
  // 低于这个滚动位移就忽略，避免静止时文字也出现彩边。
  minDelta: number;
};

// 只在滚动时出现的色散效果。
// 之前如果跟随鼠标触发，会把正文一起横向偏移，看起来像文字下方有残影。
export function createScrollChromaticEffect(options: ScrollChromaticEffectOptions): CanvasEffect {
  const { shiftBase, shiftSpeedBoost, shiftPulseBoost, alpha, decayMs, minDelta } = options;
  let previousScrollTop = 0;
  let lastScrollAt = 0;
  let scrollVelocity = 0;

  return ({ ctx, stagingCanvas, sourceRoot, time, width, height }) => {
    const currentScrollTop = sourceRoot.scrollTop;
    const scrollDelta = currentScrollTop - previousScrollTop;

    if (Math.abs(scrollDelta) > minDelta) {
      // 记录本次滚动，用于之后的“余韵衰减”。
      lastScrollAt = time;
      scrollVelocity = Math.min(1, Math.abs(scrollDelta) / 28);
    } else {
      scrollVelocity *= 0.88;
    }
    previousScrollTop = currentScrollTop;

    const decay = lastScrollAt === 0 ? 0 : Math.max(0, 1 - (time - lastScrollAt) / decayMs);
    const scrollInfluence = Math.max(scrollVelocity, decay);

    if (scrollInfluence <= 0.001) {
      return;
    }

    // 用双向偏移制造轻微 RGB 错位感，但仍保持正文可辨识。
    const pulse = 0.5 + 0.5 * Math.sin(time / 420);
    const shift = scrollInfluence * (shiftBase + shiftSpeedBoost + shiftPulseBoost * pulse);

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = alpha * scrollInfluence;
    ctx.filter = 'hue-rotate(22deg) saturate(1.1)';
    ctx.drawImage(stagingCanvas, shift, 0, width, height);
    ctx.filter = 'hue-rotate(-18deg) saturate(1.1)';
    ctx.drawImage(stagingCanvas, -shift, 0, width, height);
    ctx.restore();
  };
}
