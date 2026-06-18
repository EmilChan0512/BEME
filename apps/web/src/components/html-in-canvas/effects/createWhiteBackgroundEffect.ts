import type { CanvasEffect } from './types';

// 每帧先铺一层纯白底，避免上一帧残留和暖色底影响后续炫彩效果。
export function createWhiteBackgroundEffect(): CanvasEffect {
  return ({ ctx, width, height }) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  };
}
