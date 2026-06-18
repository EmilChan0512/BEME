import type { CanvasEffect } from './types';

type PointerStateRef = {
  current: {
    // 归一化后的横向位置，范围 0~1。
    x: number;
    // 归一化后的纵向位置，范围 0~1。
    y: number;
    // 横向速度，单位约等于“每毫秒移动了多少屏宽”。
    vx: number;
    // 纵向速度，单位约等于“每毫秒移动了多少屏高”。
    vy: number;
    // 当前是否处于按下状态。
    isDown: boolean;
  };
};

type PointerAuroraEffectOptions = {
  // 指针状态引用，由 usePointerTracker 提供。
  pointerRef: PointerStateRef;
  // 光圈基础半径比例，鼠标静止时主要受它控制。
  baseRadiusRatio: number;
  // 鼠标越快时半径额外增加多少。
  speedRadiusBoost: number;
  // 径向渐变内核起点，越小中心越锐利。
  innerStop: number;
  // 中心青绿色层的基础透明度。
  centerGreenAlpha: number;
  // 鼠标速度越快时，中心青绿色额外增强多少。
  centerSpeedBoost: number;
  // 中层紫色晕染的基础透明度。
  midPurpleAlpha: number;
  // 呼吸脉冲带来的紫色层额外增益。
  midPulseBoost: number;
  // 鼠标按下时半径要缩到原来的多少。
  pressedRadiusScale: number;
  // 整个极光层最后再乘一次的总透明度。
  layerAlpha: number;
};

// 生成一个跟随指针移动的极光层。
// 它不直接修改 DOM，而是在预览层用径向渐变叠出颜色流动感。
export function createPointerAuroraEffect(options: PointerAuroraEffectOptions): CanvasEffect {
  const {
    pointerRef,
    baseRadiusRatio,
    speedRadiusBoost,
    innerStop,
    centerGreenAlpha,
    centerSpeedBoost,
    midPurpleAlpha,
    midPulseBoost,
    pressedRadiusScale,
    layerAlpha,
  } = options;

  return ({ ctx, time, width, height }) => {
    // 把 0~1 的归一化位置换算成当前画布像素坐标。
    const px = pointerRef.current.x * width;
    const py = pointerRef.current.y * height;
    // 把指针速度压到 0~1 区间，便于后面统一调参。
    const speed = Math.min(1, Math.sqrt(pointerRef.current.vx ** 2 + pointerRef.current.vy ** 2) * 1200);
    // 给中层颜色一个轻微呼吸感，画面不会完全静止。
    const pulse = 0.5 + 0.5 * Math.sin(time / 420);
    // 点击瞬间收缩，按住期间维持收缩；一旦抬起就立即恢复正常大小。
    const pressScale = pointerRef.current.isDown ? pressedRadiusScale : 1;
    const radius = 122 * (baseRadiusRatio + speed * speedRadiusBoost) * pressScale;

    const aurora = ctx.createRadialGradient(px, py, radius * innerStop, px, py, radius);
    aurora.addColorStop(0, `rgba(95, 211, 177, ${centerGreenAlpha + centerSpeedBoost * speed})`);
    aurora.addColorStop(0.42, `rgba(154, 124, 255, ${midPurpleAlpha + midPulseBoost * pulse})`);
    aurora.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = layerAlpha;
    ctx.fillStyle = aurora;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };
}
