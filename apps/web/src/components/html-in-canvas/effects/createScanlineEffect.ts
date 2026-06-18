import type { CanvasEffect } from './types';

type ScanlineEffectOptions = {
  // 扫描线间隔，越小线越密。
  step: number;
  // 扫描线漂移速度控制值，越小移动越快。
  speedDivisor: number;
  // 扫描线透明度。
  alpha: number;
};

// 叠一层轻微的显示器/投影纹理，让画面不至于过于“平”。
export function createScanlineEffect(options: ScanlineEffectOptions): CanvasEffect {
  const { step, speedDivisor, alpha } = options;

  return ({ ctx, time, width, height }) => {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.lineWidth = 1;

    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + (time / speedDivisor) % step);
      ctx.lineTo(width, y + (time / speedDivisor) % step);
      ctx.stroke();
    }

    ctx.restore();
  };
}
