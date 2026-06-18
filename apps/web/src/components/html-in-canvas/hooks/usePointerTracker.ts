import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';

export type PointerTrackerRef = MutableRefObject<{
  // 归一化后的横坐标，范围 0~1。
  x: number;
  // 归一化后的纵坐标，范围 0~1。
  y: number;
  // 横向速度，用于驱动光圈膨胀、粒子增强等效果。
  vx: number;
  // 纵向速度。
  vy: number;
  // 当前是否处于按下状态，给未来扩展交互留口子。
  isDown: boolean;
  // 上一次更新时的时间戳，用于计算速度。
  lastTs: number;
}>;

// 统一监听 pointer 事件，并把位置换算成 0~1 的归一化坐标。
// 这样 effect 不需要关心真实分辨率，只需根据相对位置和速度工作。
export function usePointerTracker() {
  const pointerRef = useRef({
    x: 0.5,
    y: 0.35,
    vx: 0,
    vy: 0,
    isDown: false,
    lastTs: 0,
  });

  useEffect(() => {
    const updatePointer = (clientX: number, clientY: number, isDown?: boolean) => {
      const ts = performance.now();
      const dt = Math.max(1, ts - pointerRef.current.lastTs);
      pointerRef.current.lastTs = ts;

      const nx = Math.min(1, Math.max(0, clientX / window.innerWidth));
      const ny = Math.min(1, Math.max(0, clientY / window.innerHeight));

      // 速度 = 本次位移 / 两次事件时间差。
      pointerRef.current.vx = (nx - pointerRef.current.x) / dt;
      pointerRef.current.vy = (ny - pointerRef.current.y) / dt;
      pointerRef.current.x = nx;
      pointerRef.current.y = ny;
      if (typeof isDown === 'boolean') {
        pointerRef.current.isDown = isDown;
      }
    };

    const onPointerMove = (event: PointerEvent) => updatePointer(event.clientX, event.clientY);
    const onPointerDown = (event: PointerEvent) => updatePointer(event.clientX, event.clientY, true);
    const onPointerUp = (event: PointerEvent) => updatePointer(event.clientX, event.clientY, false);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  return pointerRef;
}
