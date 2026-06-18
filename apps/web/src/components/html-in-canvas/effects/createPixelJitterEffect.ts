import { hash } from './math';
import type { CanvasEffect } from './types';

type PixelJitterEffectOptions = {
  // 横向分成多少个大区块。
  regionCount: number;
  // 每个时间片里触发一次局部偏差的概率。
  activeChance: number;
  // 一次局部偏差持续多久，越小回正越快。
  burstDurationMs: number;
  // 横向最大位移，越大越像信号错轨。
  maxOffsetX: number;
  // 纵向撕裂位移，越大越有“左下右上”的拉扯感。
  maxOffsetY: number;
  // 整体透明度。
  alpha: number;
  // 多久换一次抖动采样，越小跳得越快。
  timeStepMs: number;
  // 第一层偏色滤镜。
  primaryFilter: string;
  // 第二层偏色滤镜。
  secondaryFilter: string;
};

// 用横向大区块制造一种“偶发的局部故障偏移”，
// 大多数时间保持稳定，只有部分时刻某一个区块会突然错位一下。
export function createPixelJitterEffect(options: PixelJitterEffectOptions): CanvasEffect {
  const {
    regionCount,
    activeChance,
    burstDurationMs,
    maxOffsetX,
    maxOffsetY,
    alpha,
    timeStepMs,
    primaryFilter,
    secondaryFilter,
  } = options;

  return ({ ctx, stagingCanvas, time, width, height }) => {
    const stepIndex = Math.floor(time / timeStepMs);
    const stepElapsed = time - stepIndex * timeStepMs;
    const activationSeed = stepIndex * 11.73;
    if (hash(activationSeed) > activeChance) {
      return;
    }

    const maxBurstStart = Math.max(0, timeStepMs - burstDurationMs);
    const burstStartMs = hash(activationSeed + 3.47) * maxBurstStart;
    const burstEndMs = burstStartMs + burstDurationMs;
    if (stepElapsed < burstStartMs || stepElapsed > burstEndMs) {
      return;
    }

    const burstProgress = (stepElapsed - burstStartMs) / Math.max(1, burstDurationMs);
    const decay = (1 - burstProgress) ** 2;
    const activeIndex = Math.floor(hash(activationSeed + 7.19) * regionCount);
    const pulse = 0.55 + 0.45 * Math.sin(time / 180);
    const strength = alpha * pulse * decay;
    const baseRegionWidth = width / Math.max(1, regionCount);

    for (let index = 0; index < regionCount; index += 1) {
      if (index !== activeIndex) {
        continue;
      }

      const seed = stepIndex * 17.17 + index * 29.3;
      const sourceX = Math.round(index * baseRegionWidth);
      const nextSourceX = index === regionCount - 1 ? width : Math.round((index + 1) * baseRegionWidth);
      const currentRegionWidth = Math.max(2, nextSourceX - sourceX);
      const regionCenterRatio = (sourceX + currentRegionWidth * 0.5) / Math.max(1, width);
      const tearDirection = 1 - regionCenterRatio * 2;
      const lowFrequencyGain = 0.62 + hash(seed + 0.4) * 0.38;
      const tearOffsetY = tearDirection * maxOffsetY * lowFrequencyGain;
      const randomOffsetY = (hash(seed + 4.6) - 0.5) * 2 * maxOffsetY * 0.16;
      const offsetX = (hash(seed + 2.8) - 0.5) * 2 * maxOffsetX * 0.42;
      const offsetY = tearOffsetY + randomOffsetY;
      const regionStrength = 0.72 + hash(seed + 5.8) * 0.38;
      const replacementAlpha = Math.min(0.96, 0.68 + strength * 0.95 * regionStrength);
      const ghostAlpha = Math.min(0.5, strength * 0.65 * regionStrength);

      ctx.save();
      ctx.beginPath();
      ctx.rect(sourceX, 0, currentRegionWidth, height);
      ctx.clip();
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(sourceX, 0, currentRegionWidth, height);
      ctx.filter = 'none';
      ctx.globalAlpha = replacementAlpha;
      ctx.drawImage(
        stagingCanvas,
        sourceX,
        0,
        currentRegionWidth,
        height,
        sourceX + offsetX,
        offsetY,
        currentRegionWidth,
        height,
      );
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(sourceX, 0, currentRegionWidth, height);
      ctx.clip();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = secondaryFilter;
      ctx.globalAlpha = ghostAlpha;
      ctx.drawImage(
        stagingCanvas,
        sourceX,
        0,
        currentRegionWidth,
        height,
        sourceX - offsetX * 0.55,
        -tearOffsetY * 0.58 - randomOffsetY * 0.35,
        currentRegionWidth,
        height,
      );
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(sourceX, 0, currentRegionWidth, height);
      ctx.clip();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = primaryFilter;
      ctx.globalAlpha = ghostAlpha * 0.72;
      ctx.drawImage(
        stagingCanvas,
        sourceX,
        0,
        currentRegionWidth,
        height,
        sourceX + offsetX * 0.35,
        offsetY * 0.55,
        currentRegionWidth,
        height,
      );
      ctx.restore();
    }
  };
}
