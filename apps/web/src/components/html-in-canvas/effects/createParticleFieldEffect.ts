import { hash, softstep } from './math';
import type { CanvasEffect } from './types';

type PointerStateRef = {
  current: {
    // 归一化后的横向位置，范围 0~1。
    x: number;
    // 归一化后的纵向位置，范围 0~1。
    y: number;
    // 横向速度。
    vx: number;
    // 纵向速度。
    vy: number;
  };
};

type ParticleFieldEffectOptions = {
  // 指针状态引用，用于让粒子围绕鼠标/手指运动。
  pointerRef: PointerStateRef;
  // 粒子数量，越大越丰富，但也更容易显得脏。
  count: number;
  // 粒子基础透明度。
  alphaBase: number;
  // 指针速度越快时，粒子透明度额外增强多少。
  alphaSpeedBoost: number;
  // 粒子基础尺寸。
  sizeBase: number;
  // 粒子尺寸的随机浮动范围。
  sizeBoost: number;
  // 粒子场基础作用半径比例。
  radiusBaseRatio: number;
  // 鼠标越快时，粒子场额外向外扩多大。
  radiusSpeedBoost: number;
};

// 生成围绕指针旋转扩散的粒子场。
// 这里不使用真正的随机数，而是用 hash(seed) 做可重复伪随机，保证动画连续。
export function createParticleFieldEffect(options: ParticleFieldEffectOptions): CanvasEffect {
  const {
    pointerRef,
    count,
    alphaBase,
    alphaSpeedBoost,
    sizeBase,
    sizeBoost,
    radiusBaseRatio,
    radiusSpeedBoost,
  } = options;

  return ({ ctx, time, width, height }) => {
    const px = pointerRef.current.x * width;
    const py = pointerRef.current.y * height;
    const speed = Math.min(1, Math.sqrt(pointerRef.current.vx ** 2 + pointerRef.current.vy ** 2) * 1200);
    const radius = Math.max(220, Math.min(width, height) * (radiusBaseRatio + speed * radiusSpeedBoost));

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    for (let i = 0; i < count; i += 1) {
      // 用粒子序号 + 时间切片拼成 seed，让每一帧既连续又不会完全静止。
      const seed = i * 10.7 + Math.floor(time / 20);
      const angle = hash(seed) * Math.PI * 2;
      const distance = radius * (0.15 + 0.85 * hash(seed + 1.3));
      const x = px + Math.cos(angle) * distance;
      const y = py + Math.sin(angle) * distance;
      // softstep 让透明度衰减更柔和，避免粒子边缘显得太生硬。
      const alpha = softstep(1, 0, hash(seed + 2.1)) * (alphaBase + alphaSpeedBoost * speed);
      const size = sizeBase + sizeBoost * hash(seed + 3.9);

      ctx.fillStyle = `rgba(24, 144, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };
}
