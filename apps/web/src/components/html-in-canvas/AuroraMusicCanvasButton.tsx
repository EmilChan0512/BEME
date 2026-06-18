import { useEffect, useRef, useState } from 'react';

type AuroraMusicCanvasButtonProps = {
  isPlaying: boolean;
  onToggle: () => void;
  getFrequencyData: () => Uint8Array | null;
};

export function AuroraMusicCanvasButton({
  isPlaying,
  onToggle,
  getFrequencyData,
}: AuroraMusicCanvasButtonProps) {
  const LABEL_VISIBILITY_DELAY_MS = 378;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const displaySamplesRef = useRef<number[]>([]);
  const visualProgressRef = useRef(0);
  const iconVisibilityProgressRef = useRef(0);
  const labelVisibilityProgressRef = useRef(0);
  const hideTimeoutRef = useRef<number | null>(null);
  const labelDelayTimeoutRef = useRef<number | null>(null);
  const [isIconVisible, setIsIconVisible] = useState(false);
  const [isLabelVisible, setIsLabelVisible] = useState(false);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
      }
      if (labelDelayTimeoutRef.current !== null) {
        window.clearTimeout(labelDelayTimeoutRef.current);
      }
    };
  }, []);

  const showButton = () => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (labelDelayTimeoutRef.current !== null) {
      window.clearTimeout(labelDelayTimeoutRef.current);
    }

    setIsIconVisible(true);
    labelDelayTimeoutRef.current = window.setTimeout(() => {
      setIsLabelVisible(true);
      labelDelayTimeoutRef.current = null;
    }, LABEL_VISIBILITY_DELAY_MS);
  };

  const scheduleHide = () => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = window.setTimeout(() => {
      setIsIconVisible(false);
      hideTimeoutRef.current = null;
    }, 1000);

    if (labelDelayTimeoutRef.current !== null) {
      window.clearTimeout(labelDelayTimeoutRef.current);
    }

    labelDelayTimeoutRef.current = window.setTimeout(() => {
      setIsLabelVisible(false);
      labelDelayTimeoutRef.current = null;
    }, 1000 + LABEL_VISIBILITY_DELAY_MS);
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    let frameId = 0;

    const render = (time: number) => {
      const ratio = window.devicePixelRatio || 1;
      const cssWidth = canvas.clientWidth || 188;
      const cssHeight = canvas.clientHeight || 68;
      const width = Math.max(1, Math.round(cssWidth * ratio));
      const height = Math.max(1, Math.round(cssHeight * ratio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(ratio, ratio);
      context.clearRect(0, 0, cssWidth, cssHeight);

      // visualProgress 表示“视觉上有多接近播放态”，
      // 它不会因为 isPlaying 切换而立刻跳变，而是缓慢过渡到目标值。
      const targetVisualProgress = isPlaying ? 1 : 0;
      // 播放时进入得稍快一些，暂停时回落明显放慢，确保肉眼能看见颜色“冷却”过程。
      const visualTransitionSpeed = isPlaying ? 0.12 : 0.026;
      visualProgressRef.current += (targetVisualProgress - visualProgressRef.current) * visualTransitionSpeed;
      const visualProgress = visualProgressRef.current;
      const targetIconVisibility = isIconVisible ? 1 : 0;
      iconVisibilityProgressRef.current +=
        (targetIconVisibility - iconVisibilityProgressRef.current) * 0.14;
      const iconVisibility = iconVisibilityProgressRef.current;
      const targetLabelVisibility = isLabelVisible ? 1 : 0;
      labelVisibilityProgressRef.current +=
        (targetLabelVisibility - labelVisibilityProgressRef.current) * 0.12;
      const labelVisibility = labelVisibilityProgressRef.current;

      // 先画一层玻璃按钮底板，让音浪曲线落在一个清晰的交互区域上。
      const shell = context.createLinearGradient(0, 0, cssWidth, cssHeight);
      shell.addColorStop(0, mixColor([255, 255, 255, 0.96], [255, 255, 255, 0.98], visualProgress));
      shell.addColorStop(1, mixColor([244, 247, 255, 0.92], [220, 242, 255, 0.96], visualProgress));
      context.fillStyle = shell;
      roundRect(context, 0, 0, cssWidth, cssHeight, 999);
      context.fill();

      // 外层玻璃扫光：让整个按钮像有一层顺着表面滑过的高光膜。
      const glassSweep = context.createLinearGradient(0, 0, cssWidth, cssHeight);
      glassSweep.addColorStop(0, mixColor([255, 255, 255, 0.04], [255, 255, 255, 0.08], visualProgress));
      glassSweep.addColorStop(0.35, mixColor([255, 255, 255, 0.18], [255, 255, 255, 0.34], visualProgress));
      glassSweep.addColorStop(0.7, mixColor([255, 255, 255, 0.06], [210, 244, 255, 0.16], visualProgress));
      glassSweep.addColorStop(1, mixColor([255, 255, 255, 0.02], [255, 255, 255, 0.05], visualProgress));
      context.fillStyle = glassSweep;
      roundRect(context, 0, 0, cssWidth, cssHeight, 999);
      context.fill();

      context.strokeStyle = mixColor([148, 163, 184, 0.34], [84, 214, 255, 0.58], visualProgress);
      context.lineWidth = 1;
      roundRect(context, 0.5, 0.5, cssWidth - 1, cssHeight - 1, 999);
      context.stroke();

      // 玻璃边缘的内高光，让轮廓更像有厚度的透明材质。
      context.save();
      context.strokeStyle = mixColor([255, 255, 255, 0.22], [246, 254, 255, 0.54], visualProgress);
      context.lineWidth = 1;
      roundRect(context, 2, 2, cssWidth - 4, cssHeight - 4, 999);
      context.stroke();
      context.restore();

      // 顶部折射高光：只落在上半部分，模拟玻璃表面弧形反光。
      context.save();
      context.beginPath();
      roundRect(context, 7, 7, cssWidth - 14, cssHeight * 0.48, 999);
      context.clip();
      const topGlow = context.createLinearGradient(0, 6, 0, cssHeight * 0.52);
      topGlow.addColorStop(0, mixColor([255, 255, 255, 0.34], [255, 255, 255, 0.52], visualProgress));
      topGlow.addColorStop(1, mixColor([255, 255, 255, 0.02], [255, 255, 255, 0.08], visualProgress));
      context.fillStyle = topGlow;
      context.fillRect(0, 0, cssWidth, cssHeight * 0.56);
      context.restore();

      context.save();
      context.beginPath();
      roundRect(context, 6, 6, cssWidth - 12, cssHeight - 12, 999);
      context.clip();

      const pulse = 0.5 + 0.5 * Math.sin(time / 420);
      const amplitude = isPlaying ? 12 + 10 * pulse : 3;
      const centerY = cssHeight * 0.5;
      const frequencyData = getFrequencyData();
      const sampleCount = 40;
      const targetSamples = new Array(sampleCount).fill(0).map((_, index) => {
        if (!frequencyData || frequencyData.length === 0) {
          return 0;
        }

        const dataIndex = Math.min(
          frequencyData.length - 1,
          Math.floor((index / sampleCount) * Math.min(frequencyData.length, 72)),
        );
        return frequencyData[dataIndex] / 255;
      });

      // displaySamples 保存“屏幕上正在显示的频谱值”，
      // 暂停/结束时不直接跳到 0，而是每帧朝目标值缓慢靠拢，形成回落过渡。
      if (displaySamplesRef.current.length !== sampleCount) {
        displaySamplesRef.current = new Array(sampleCount).fill(0);
      }

      // 频谱同样采用快起慢落：播放时快速跟上节奏，暂停/结束时拖着尾音慢慢回静。
      const settleSpeed = isPlaying ? 0.2 : 0.03;
      const samples = displaySamplesRef.current.map((current, index) => {
        const target = targetSamples[index] ?? 0;
        const next = current + (target - current) * settleSpeed;
        displaySamplesRef.current[index] = next;
        return next;
      });

      const averageEnergy = samples.reduce((total, value) => total + value, 0) / Math.max(1, samples.length);
      const spectrumAmplitude =
        amplitude * mixNumber(1, 0.32 + averageEnergy * 1.25, visualProgress);

      // 后景辉光。
      context.strokeStyle = mixColor([148, 163, 184, 0.12], [107, 233, 255, 0.18], visualProgress);
      context.lineWidth = 12;
      context.lineCap = 'round';
      context.beginPath();
      for (let x = 0; x <= cssWidth; x += 3) {
        const t = x / cssWidth;
        const sampleIndex = Math.min(sampleCount - 1, Math.floor(t * (sampleCount - 1)));
        const energy = samples[sampleIndex] ?? 0;
        const wave =
          Math.sin(t * 18 + time / 220) +
          0.5 * Math.sin(t * 32 - time / 310) +
          energy * 1.6;
        const y = centerY + wave * spectrumAmplitude * 0.3;
        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();

      // 主音浪。
      const waveGradient = context.createLinearGradient(0, 0, cssWidth, 0);
      waveGradient.addColorStop(0, mixColor([71, 85, 105, 0.62], [30, 144, 255, 0.95], visualProgress));
      waveGradient.addColorStop(0.5, mixColor([100, 116, 139, 0.74], [45, 212, 191, 1], visualProgress));
      waveGradient.addColorStop(1, mixColor([71, 85, 105, 0.62], [168, 85, 247, 0.95], visualProgress));
      context.strokeStyle = waveGradient;
      context.lineWidth = 2.4;
      context.beginPath();
      for (let x = 0; x <= cssWidth; x += 2) {
        const t = x / cssWidth;
        const sampleIndex = Math.min(sampleCount - 1, Math.floor(t * (sampleCount - 1)));
        const energy = samples[sampleIndex] ?? 0;
        const wave =
          Math.sin(t * 20 + time / 180) +
          0.68 * Math.sin(t * 38 - time / 250) +
          0.25 * Math.sin(t * 64 + time / 120) +
          energy * 2.8;
        const y = centerY + wave * spectrumAmplitude * 0.24;
        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();

      // 左侧图标改成“形变”而不是简单淡入淡出：
      // 播放三角会逐渐收拢成左暂停条，右暂停条再从尖端位置长出来。
      const iconColor = mixColor([15, 23, 42, 0.72], [10, 20, 35, 0.88], visualProgress);
      const labelColor = mixColor([51, 65, 85, 0.76], [15, 23, 42, 0.76], visualProgress);
      const playAlpha = 1 - visualProgress;
      const pauseAlpha = visualProgress;

      context.save();
      context.fillStyle = iconColor;
      drawMorphingPlayPauseIcon(context, 18, centerY - 10, visualProgress, iconVisibility);
      context.restore();

      context.font = '600 11px Inter, system-ui, sans-serif';
      context.textBaseline = 'middle';

      context.save();
      context.fillStyle = labelColor;
      context.globalAlpha = playAlpha * labelVisibility;
      context.fillText('PLAY BGM', 42 - visualProgress * 6, centerY);
      context.restore();

      context.save();
      context.fillStyle = labelColor;
      context.globalAlpha = pauseAlpha * labelVisibility;
      context.fillText('BGM ON', 42 + (1 - visualProgress) * 6, centerY);
      context.restore();

      // 右上角补一条细高光弧线，强化玻璃质感而不是普通渐变按钮。
      context.save();
      context.strokeStyle = mixColor([255, 255, 255, 0.16], [255, 255, 255, 0.34], visualProgress);
      context.lineWidth = 1.4;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(cssWidth * 0.46, 14);
      context.quadraticCurveTo(cssWidth * 0.72, 8, cssWidth - 20, 18);
      context.stroke();
      context.restore();

      context.restore();
      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [getFrequencyData, isIconVisible, isLabelVisible, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="aurora-source__music-canvas-button"
      role="button"
      tabIndex={0}
      aria-label={isPlaying ? 'Pause background music' : 'Play background music'}
      aria-pressed={isPlaying}
      onClick={onToggle}
      onPointerEnter={showButton}
      onPointerLeave={scheduleHide}
      onFocus={showButton}
      onBlur={scheduleHide}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          showButton();
          onToggle();
        }
      }}
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width * 0.5, height * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function mixNumber(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function mixColor(from: [number, number, number, number], to: [number, number, number, number], progress: number) {
  const r = mixNumber(from[0], to[0], progress);
  const g = mixNumber(from[1], to[1], progress);
  const b = mixNumber(from[2], to[2], progress);
  const a = mixNumber(from[3], to[3], progress);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function drawMorphingPlayPauseIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  alpha: number,
) {
  const eased = easeInOutCubic(progress);
  const bodyX = x;
  const bodyY = mixNumber(y, y + 2, eased);
  const bodyWidth = mixNumber(14, 4, eased);
  const bodyHeight = mixNumber(20, 16, eased);
  const tailRadius = mixNumber(2.4, 2.2, eased);
  const tipInset = mixNumber(0, 0.85, eased);
  const tipCurve = mixNumber(1.8, 0.6, eased);
  const tipX = mixNumber(x + 14, x + 4, eased);
  const centerY = y + 10;
  const topY = bodyY;
  const bottomY = bodyY + bodyHeight;

  // 主体采用更柔和的曲线路径，避免三角和竖条之间的切换显得生硬。
  ctx.beginPath();
  ctx.moveTo(bodyX + tailRadius, topY);
  ctx.lineTo(tipX - tipCurve, centerY - tipInset);
  ctx.quadraticCurveTo(tipX, centerY, tipX - tipCurve, centerY + tipInset);
  ctx.lineTo(bodyX + tailRadius, bottomY);
  ctx.quadraticCurveTo(bodyX, bottomY, bodyX, bottomY - tailRadius);
  ctx.lineTo(bodyX, topY + tailRadius);
  ctx.quadraticCurveTo(bodyX, topY, bodyX + tailRadius, topY);
  ctx.closePath();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fill();
  ctx.restore();

  // 叠加一层圆角矩形，让形变后期更接近圆润的暂停条。
  ctx.save();
  ctx.globalAlpha = alpha * eased * 0.92;
  roundRect(ctx, bodyX, bodyY, bodyWidth, bodyHeight, 2.2);
  ctx.fill();
  ctx.restore();

  // 右半部分从三角尖端位置长成第二根暂停条。
  const rightGrowth = clamp((eased - 0.18) / 0.82, 0, 1);
  const rightBarWidth = 4;
  const rightBarHeight = 16 * rightGrowth;
  const rightBarY = y + 2 + (16 - rightBarHeight) * 0.5;
  const rightBarX = mixNumber(x + 12, x + 8, rightGrowth);

  if (rightGrowth > 0.001) {
    ctx.save();
    ctx.globalAlpha = alpha * rightGrowth;
    roundRect(ctx, rightBarX, rightBarY, rightBarWidth, rightBarHeight, 2);
    ctx.fill();
    ctx.restore();
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeInOutCubic(value: number) {
  if (value < 0.5) {
    return 4 * value * value * value;
  }

  return 1 - (-2 * value + 2) ** 3 / 2;
}
