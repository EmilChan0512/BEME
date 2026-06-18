import type { CanvasEffect } from './types';

type PortraitBackgroundEffectOptions = {
  imageSrc: string;
  alpha: number;
  glowAlpha: number;
  maxWidthRatio: number;
  maxHeightRatio: number;
  centerXRatio: number;
  centerYRatio: number;
  whiteThreshold: number;
  fitMode?: 'contain' | 'cover';
  colorCompositeMode?: GlobalCompositeOperation;
};

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

// 把黑白头像处理成“白色透明、深色线稿映射为青蓝渐变”的抽象背景层。
export function createPortraitBackgroundEffect(options: PortraitBackgroundEffectOptions): CanvasEffect {
  const {
    imageSrc,
    alpha,
    glowAlpha,
    maxWidthRatio,
    maxHeightRatio,
    centerXRatio,
    centerYRatio,
    whiteThreshold,
    fitMode = 'contain',
    colorCompositeMode = 'multiply',
  } = options;

  let image: HTMLImageElement | null = null;
  let isLoading = false;
  let processedCanvas: HTMLCanvasElement | null = null;

  const ensureImage = () => {
    if (image || isLoading) {
      return;
    }

    isLoading = true;
    image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const width = image?.naturalWidth ?? 0;
      const height = image?.naturalHeight ?? 0;
      if (!image || width <= 0 || height <= 0) {
        return;
      }

      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = width;
      sourceCanvas.height = height;
      const sourceCtx = sourceCanvas.getContext('2d');
      if (!sourceCtx) {
        return;
      }

      sourceCtx.drawImage(image, 0, 0, width, height);
      const imageData = sourceCtx.getImageData(0, 0, width, height);
      const { data } = imageData;

      for (let index = 0; index < data.length; index += 4) {
        const red = data[index] / 255;
        const green = data[index + 1] / 255;
        const blue = data[index + 2] / 255;
        const originalAlpha = data[index + 3] / 255;
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        const darkness = 1 - luminance;

        if (originalAlpha <= 0 || darkness <= whiteThreshold) {
          data[index + 3] = 0;
          continue;
        }

        const normalizedDarkness = (darkness - whiteThreshold) / Math.max(0.0001, 1 - whiteThreshold);
        const easedDarkness = normalizedDarkness ** 1.45;
        const pixelIndex = index / 4;
        const y = Math.floor(pixelIndex / width);
        const verticalT = y / Math.max(1, height - 1);
        const cyanStrength = 1 - verticalT * 0.58;

        data[index] = Math.round(lerp(52, 26, verticalT));
        data[index + 1] = Math.round(lerp(244, 173, 1 - cyanStrength * 0.22));
        data[index + 2] = Math.round(lerp(255, 255, verticalT));
        data[index + 3] = Math.round(Math.min(1, originalAlpha * easedDarkness) * 255);
      }

      processedCanvas = document.createElement('canvas');
      processedCanvas.width = width;
      processedCanvas.height = height;
      const processedCtx = processedCanvas.getContext('2d');
      if (!processedCtx) {
        processedCanvas = null;
        return;
      }

      processedCtx.putImageData(imageData, 0, 0);
    };
    image.onerror = () => {
      image = null;
      isLoading = false;
      processedCanvas = null;
    };
    image.src = imageSrc;
  };

  return ({ ctx, width, height, time }) => {
    ensureImage();

    if (!processedCanvas) {
      return;
    }

    const sourceWidth = processedCanvas.width;
    const sourceHeight = processedCanvas.height;
    const widthScale = (width * maxWidthRatio) / sourceWidth;
    const heightScale = (height * maxHeightRatio) / sourceHeight;
    const scale = fitMode === 'cover' ? Math.max(widthScale, heightScale) : Math.min(widthScale, heightScale);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const drawX = width * centerXRatio - drawWidth * 0.5;
    const drawY = height * centerYRatio - drawHeight * 0.5;
    const pulse = 0.94 + 0.06 * Math.sin(time / 1700);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = 'blur(22px)';
    ctx.globalAlpha = glowAlpha * pulse;
    ctx.drawImage(processedCanvas, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = colorCompositeMode;
    ctx.globalAlpha = alpha;
    ctx.drawImage(processedCanvas, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
  };
}
