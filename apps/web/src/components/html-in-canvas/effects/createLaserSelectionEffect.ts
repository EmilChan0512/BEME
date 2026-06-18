import type { CanvasEffect } from './types';

type SelectionRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type LaserSelectionEffectOptions = {
  // 选区底层渐变的整体透明度。
  fillAlpha: number;
  // 选区描边与上下激光边的透明度。
  lineAlpha: number;
  // 发光模糊半径。
  glowBlur: number;
  // 斜向切片纹理的透明度。
  stripeAlpha: number;
  // 切片间距。
  stripeGap: number;
  // 单条切片宽度。
  stripeWidth: number;
  // 选区圆角。
  radius: number;
  // 扫光横向移动速度，数值越小移动越快。
  sweepSpeedDivisor: number;
};

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.max(0, Math.min(radius, width * 0.5, height * 0.5));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function isNodeInsideRoot(node: Node | null, sourceRoot: HTMLElement) {
  if (!node) {
    return false;
  }

  if (node instanceof Element) {
    return sourceRoot.contains(node);
  }

  return Boolean(node.parentElement && sourceRoot.contains(node.parentElement));
}

function collectSelectionRects(sourceRoot: HTMLElement): SelectionRect[] {
  const selection = document.getSelection();

  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return [];
  }

  const sourceRect = sourceRoot.getBoundingClientRect();

  if (sourceRect.width <= 0 || sourceRect.height <= 0) {
    return [];
  }

  const rects: SelectionRect[] = [];

  for (let index = 0; index < selection.rangeCount; index += 1) {
    const range = selection.getRangeAt(index);

    if (
      !isNodeInsideRoot(range.startContainer, sourceRoot) ||
      !isNodeInsideRoot(range.endContainer, sourceRoot)
    ) {
      continue;
    }

    for (const clientRect of Array.from(range.getClientRects())) {
      const left = Math.max(clientRect.left, sourceRect.left);
      const top = Math.max(clientRect.top, sourceRect.top);
      const right = Math.min(clientRect.right, sourceRect.right);
      const bottom = Math.min(clientRect.bottom, sourceRect.bottom);
      const width = right - left;
      const height = bottom - top;

      if (width <= 1 || height <= 1) {
        continue;
      }

      rects.push({ left, top, width, height });
    }
  }

  return rects;
}

// 把原生文本选区升级成“激光切片”风格：
// 1. DOM 层只负责压掉系统默认蓝色选区；
// 2. 真正的选区表现由 preview canvas 叠加发光描边、扫光和斜向切片纹理。
export function createLaserSelectionEffect(options: LaserSelectionEffectOptions): CanvasEffect {
  const { fillAlpha, lineAlpha, glowBlur, stripeAlpha, stripeGap, stripeWidth, radius, sweepSpeedDivisor } =
    options;

  return ({ ctx, sourceRoot, time, width, height }) => {
    const sourceRect = sourceRoot.getBoundingClientRect();
    const selectionRects = collectSelectionRects(sourceRoot);

    if (selectionRects.length === 0 || sourceRect.width <= 0 || sourceRect.height <= 0) {
      return;
    }

    const scaleX = width / sourceRect.width;
    const scaleY = height / sourceRect.height;

    for (const rect of selectionRects) {
      const x = (rect.left - sourceRect.left) * scaleX;
      const y = (rect.top - sourceRect.top) * scaleY;
      const rectWidth = rect.width * scaleX;
      const rectHeight = rect.height * scaleY;
      const dynamicRadius = radius * Math.min(scaleX, scaleY);

      const fillGradient = ctx.createLinearGradient(x, y, x + rectWidth, y + rectHeight);
      fillGradient.addColorStop(0, `rgba(76, 236, 255, ${fillAlpha * 0.9})`);
      fillGradient.addColorStop(0.5, `rgba(142, 121, 255, ${fillAlpha})`);
      fillGradient.addColorStop(1, `rgba(76, 236, 255, ${fillAlpha * 0.84})`);

      ctx.save();
      ctx.shadowColor = 'rgba(74, 229, 255, 0.4)';
      ctx.shadowBlur = glowBlur;
      ctx.fillStyle = fillGradient;
      drawRoundedRectPath(ctx, x, y, rectWidth, rectHeight, dynamicRadius);
      ctx.fill();
      ctx.restore();

      ctx.save();
      drawRoundedRectPath(ctx, x, y, rectWidth, rectHeight, dynamicRadius);
      ctx.clip();

      // 一条沿着选区横向流动的扫光，让选中态看起来更像激光掠过文字。
      const sweepWidth = Math.max(14, rectWidth * 0.18);
      const sweepOffset = ((time / sweepSpeedDivisor) % (rectWidth + sweepWidth * 2)) - sweepWidth;
      const sweepGradient = ctx.createLinearGradient(x + sweepOffset, y, x + sweepOffset + sweepWidth, y);
      sweepGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sweepGradient.addColorStop(0.45, 'rgba(255, 255, 255, 0.08)');
      sweepGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.28)');
      sweepGradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.08)');
      sweepGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sweepGradient;
      ctx.fillRect(x + sweepOffset, y, sweepWidth, rectHeight);

      // 斜向切片纹理，给选区增加“激光扫描层”的结构感，而不是单纯一块纯色。
      ctx.strokeStyle = `rgba(240, 251, 255, ${stripeAlpha})`;
      ctx.lineWidth = 1;
      const stripeSpan = stripeGap + stripeWidth;
      const stripeOffset = (time / 38) % stripeSpan;
      for (let stripeX = x - rectHeight + stripeOffset; stripeX < x + rectWidth + rectHeight; stripeX += stripeSpan) {
        ctx.beginPath();
        ctx.moveTo(stripeX, y + rectHeight);
        ctx.lineTo(stripeX + rectHeight, y);
        ctx.stroke();
      }

      ctx.restore();

      // 上下两条高亮边，让选区更像激光切出的窗口。
      ctx.save();
      ctx.strokeStyle = `rgba(214, 249, 255, ${lineAlpha})`;
      ctx.shadowColor = 'rgba(110, 233, 255, 0.5)';
      ctx.shadowBlur = glowBlur * 0.7;
      ctx.lineWidth = Math.max(1, Math.min(2, rectHeight * 0.08));
      ctx.beginPath();
      ctx.moveTo(x + dynamicRadius, y + 1);
      ctx.lineTo(x + rectWidth - dynamicRadius, y + 1);
      ctx.moveTo(x + dynamicRadius, y + rectHeight - 1);
      ctx.lineTo(x + rectWidth - dynamicRadius, y + rectHeight - 1);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = `rgba(74, 232, 255, ${lineAlpha * 0.72})`;
      ctx.lineWidth = 1;
      drawRoundedRectPath(ctx, x, y, rectWidth, rectHeight, dynamicRadius);
      ctx.stroke();
      ctx.restore();
    }
  };
}
