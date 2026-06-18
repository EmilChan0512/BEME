import type { CanvasEffect } from './types';

type VignetteEffectOptions = {
  // 暗角开始变深的位置比例。
  innerRatio: number;
  // 暗角延伸到画布外圈的位置比例。
  outerRatio: number;
  // 暗角最终强度。
  alpha: number;
};

// 给画面边缘压一点暗角，让注意力更多停留在中心区域。
export function createVignetteEffect(options: VignetteEffectOptions): CanvasEffect {
  const { innerRatio, outerRatio, alpha } = options;

  return ({ ctx, width, height }) => {
    const vignette = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * innerRatio,
      width * 0.5,
      height * 0.55,
      Math.max(width, height) * outerRatio,
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  };
}
