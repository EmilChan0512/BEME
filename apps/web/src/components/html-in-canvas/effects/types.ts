// 所有特效模块共享的入参。
// 这里约定的是“预览层渲染时能拿到哪些上下文”，方便各个 effect 像积木一样组合。
export type CanvasEffectArgs = {
  // 当前正在绘制的预览层 2D 上下文。
  ctx: CanvasRenderingContext2D;
  // html-in-canvas 捕获出来的 staging canvas，里面保存的是 DOM 的当前画面。
  stagingCanvas: HTMLCanvasElement;
  // 真正承载内容的 DOM 根节点，可用于读取滚动位置等交互状态。
  sourceRoot: HTMLElement;
  // 当前帧时间戳，通常来自 performance.now()。
  time: number;
  // 当前预览层的实际像素宽度，已经乘过 DPR。
  width: number;
  // 当前预览层的实际像素高度，已经乘过 DPR。
  height: number;
};

// 单个 effect 的统一签名。
export type CanvasEffect = (args: CanvasEffectArgs) => void;
