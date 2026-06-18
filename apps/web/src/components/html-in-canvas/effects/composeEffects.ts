import type { CanvasEffect, CanvasEffectArgs } from './types';

// 把多个独立 effect 串成一条渲染流水线。
// 顺序很重要：前面的 effect 会给后面的 effect 打底。
export function composeEffects(effects: CanvasEffect[]): CanvasEffect {
  return (args: CanvasEffectArgs) => {
    for (const effect of effects) {
      effect(args);
    }
  };
}
