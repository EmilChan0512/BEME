import type { CanvasEffect } from './types';

type DomLayerEffectOptions = {
  // DOM 层整体透明度，越低越容易被特效层盖过去。
  alpha: number;
  // 直接作用在 DOM 截图上的滤镜，用来微调对比度、亮度、饱和度。
  filter: string;
};

// 把 staging canvas 里的真实 DOM 画面绘制到预览层。
// 这是所有后处理效果的“内容底板”。
export function createDomLayerEffect(options: DomLayerEffectOptions): CanvasEffect {
  const { alpha, filter } = options;

  return ({ ctx, stagingCanvas, width, height }) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.filter = filter;
    ctx.drawImage(stagingCanvas, 0, 0, width, height);
    ctx.restore();
  };
}
