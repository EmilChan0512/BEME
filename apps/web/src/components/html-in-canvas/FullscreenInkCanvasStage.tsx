import { useMemo } from 'react';
import { HtmlInCanvasPreviewRenderer, HtmlInCanvasStage } from './HtmlInCanvasStage';
import './FullscreenInkCanvasStage.css';

type FullscreenInkCanvasStageProps = {
  date: string;
  title: string;
  summary: string;
  note: string;
  highlights: string[];
  tags: string[];
};

// 水墨 preset 的真实 DOM 内容。
// 输入框和文本区域都保留真实可交互能力，再由上层 preview 做“墨色观看”。
function InkSourceContent({
  date,
  title,
  summary,
  note,
  highlights,
  tags,
}: FullscreenInkCanvasStageProps) {
  return (
    <section className="ink-canvas-source">
      <div className="ink-canvas-source__paper">
        <p className="ink-canvas-source__date">{date}</p>
        <h1 className="ink-canvas-source__title">{title}</h1>
        <p className="ink-canvas-source__summary">{summary}</p>

        <div className="ink-canvas-source__field">
          <input
            className="ink-canvas-source__input"
            defaultValue="墨色沿着笔锋扩散，真实 DOM 在 shader 下保持可输入。"
            aria-label="Ink canvas source input"
          />
        </div>

        <p className="ink-canvas-source__paragraph">{note}</p>
        <p className="ink-canvas-source__paragraph">
          今天想把页面变成一张会呼吸的纸。滚动像推开一层层雾，输入框像在纸上落下一笔新墨，
          所有变化都先发生在 DOM，再被画布重新观看一遍。
        </p>

        <ul className="ink-canvas-source__list">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="ink-canvas-source__field">
          <textarea
            className="ink-canvas-source__textarea"
            defaultValue="继续写点什么，让滚动和输入都能穿过上层 preview canvas。"
            aria-label="Ink canvas source textarea"
          />
        </div>

        <div className="ink-canvas-source__tags">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className="ink-canvas-source__spacer" aria-hidden="true" />
      </div>
    </section>
  );
}

export function FullscreenInkCanvasStage(props: FullscreenInkCanvasStageProps) {
  const previewRenderer = useMemo<HtmlInCanvasPreviewRenderer>(
    () => ({ ctx, stagingCanvas, time, width, height }) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // 深色底纸，让后面的紫/绿漂移更像湿墨在夜色中晕开。
      ctx.fillStyle = '#04050a';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      // 先把 DOM 主层压进去，作为所有漂移和叠色的基础。
      ctx.filter = 'contrast(1.2) saturate(0.58) brightness(0.98)';
      ctx.globalAlpha = 0.94;
      ctx.drawImage(stagingCanvas, 0, 0, width, height);
      ctx.restore();

      // 两组不同频率的漂移，模拟墨层被水波轻微推开的感觉。
      const driftA = Math.sin(time / 760) * Math.max(2, width * 0.0028);
      const driftB = Math.cos(time / 1180) * Math.max(1.5, width * 0.0018);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.08;
      ctx.drawImage(stagingCanvas, driftA, 0, width, height);
      ctx.fillStyle = 'rgba(124, 58, 237, 0.14)';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'lighten';
      ctx.globalAlpha = 0.06;
      ctx.drawImage(stagingCanvas, -driftB, 0, width, height);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 6) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.52,
        width * 0.16,
        width * 0.5,
        height * 0.5,
        width * 0.82,
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(3, 6, 12, 0.72)');

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    },
    [],
  );

  return (
    <HtmlInCanvasStage
      className="ink-canvas-stage"
      surfaceClassName="ink-canvas-stage__surface"
      sourceRootClassName="ink-canvas-stage__source-root"
      source={<InkSourceContent {...props} />}
      fallback={<InkSourceContent {...props} />}
      previewRenderer={previewRenderer}
    />
  );
}
