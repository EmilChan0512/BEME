import type { CanvasEffect } from './types';

type ScanlineEffectOptions = {
  // 扫描线间隔，越小线越密。
  step: number;
  // 扫描线漂移速度控制值，越小移动越快。
  speedDivisor: number;
  // 扫描线透明度。
  alpha: number;
  // 主扫描线颜色。
  primaryColor: string;
  // 次扫描线颜色，用于补一点霓虹色偏。
  secondaryColor: string;
};

// 叠一层轻微的显示器/投影纹理，让画面不至于过于“平”。
export function createScanlineEffect(options: ScanlineEffectOptions): CanvasEffect {
  const { step, speedDivisor, alpha, primaryColor, secondaryColor } = options;

  return ({ ctx, time, width, height }) => {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.lineWidth = 1;
    const drift = (time / speedDivisor) % step;

    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.strokeStyle = primaryColor;
      ctx.globalAlpha = alpha;
      ctx.moveTo(0, y + drift);
      ctx.lineTo(width, y + drift);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = secondaryColor;
      ctx.globalAlpha = alpha * 0.6;
      ctx.moveTo(0, y + drift + step * 0.32);
      ctx.lineTo(width, y + drift + step * 0.32);
      ctx.stroke();
    }

    ctx.restore();
  };
}
