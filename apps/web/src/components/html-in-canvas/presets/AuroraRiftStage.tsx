import { useEffect, useMemo, useRef } from 'react';
import { HtmlInCanvasStage, type HtmlInCanvasPreviewRenderer } from '../HtmlInCanvasStage';
import './AuroraRiftStage.css';

type AuroraRiftStageProps = {
  date: string;
  title: string;
  summary: string;
  note: string;
  highlights: string[];
  tags: string[];
};

function AuroraRiftSource({
  date,
  title,
  summary,
  note,
  highlights,
  tags,
}: AuroraRiftStageProps) {
  return (
    <section className="aurora-source">
      <div className="aurora-source__paper">
        <p className="aurora-source__date">{date}</p>
        <h1 className="aurora-source__title">{title}</h1>
        <p className="aurora-source__summary">{summary}</p>

        <div className="aurora-source__divider" aria-hidden="true" />

        <p className="aurora-source__paragraph">{note}</p>
        <p className="aurora-source__paragraph">
          这一页是一个“HTML → staging canvas → preview canvas”的视觉实验：底层永远是可选择、可输入、
          可访问的 DOM；上层只是把它重新看一遍，像夜空里的极光在文字上漂移。
        </p>

        <div className="aurora-source__card">
          <h2 className="aurora-source__card-title">Instructions</h2>
          <ul className="aurora-source__list">
            <li>滚动：让纸面向上流动（source 依然是真实 DOM）。</li>
            <li>移动鼠标 / 手指：预览层会出现“裂隙”光带与粒子尾迹。</li>
            <li>选中文本：你会发现即使在上层 canvas 下，文本仍然可选。</li>
          </ul>
        </div>

        <div className="aurora-source__card">
          <h2 className="aurora-source__card-title">Fragments</h2>
          <ul className="aurora-source__fragments">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="aurora-source__meta">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className="aurora-source__spacer" aria-hidden="true" />
      </div>
    </section>
  );
}

export function AuroraRiftStage(props: AuroraRiftStageProps) {
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

  const previewRenderer = useMemo<HtmlInCanvasPreviewRenderer>(() => {
    let feedbackCanvas: HTMLCanvasElement | null = null;
    let feedbackCtx: CanvasRenderingContext2D | null = null;

    const ensureFeedback = (width: number, height: number) => {
      if (!feedbackCanvas) {
        feedbackCanvas = document.createElement('canvas');
        feedbackCtx = feedbackCanvas.getContext('2d');
      }

      if (!feedbackCanvas || !feedbackCtx) {
        return null;
      }

      if (feedbackCanvas.width !== width || feedbackCanvas.height !== height) {
        feedbackCanvas.width = width;
        feedbackCanvas.height = height;
        feedbackCtx.setTransform(1, 0, 0, 1, 0, 0);
        feedbackCtx.clearRect(0, 0, width, height);
      }

      return { canvas: feedbackCanvas, ctx: feedbackCtx };
    };

    const hash = (x: number) => {
      const s = Math.sin(x * 12.9898) * 43758.5453;
      return s - Math.floor(s);
    };

    const softstep = (edge0: number, edge1: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    };

    return ({ ctx, stagingCanvas, time, width, height }) => {
      const feedback = ensureFeedback(width, height);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // 1) 背景：这里改成纯白底（展示用），让“炫彩”更容易做对比和截图。
      //    注意：在白底上，像 screen 这种加色合成会很容易“顶到白”，所以下面的合成模式也做了相应调整。
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 2) 把上一帧轻微缩放 + 降透明度画回来，形成反馈回路（feedback loop）：
      //    这是最便宜的“拖影/流体感”，不需要像素级计算也能有生物质感。
      if (feedback) {
        const shrink = 0.1;
        const ox = (1 - shrink) * width * 0.5;
        const oy = (1 - shrink) * height * 0.5;
        ctx.save();
        ctx.globalAlpha = 0.01;
        ctx.globalCompositeOperation = 'source-over';
        ctx.setTransform(shrink, 0, 0, shrink, ox, oy);
        ctx.drawImage(feedback.canvas, 0, 0);
        ctx.restore();
      }

      // 3) 把 DOM 捕获的 staging canvas 画进来，并轻微调色。
      //    注意：这里不是 screenshot，而是“浏览器把 DOM 子树交给 canvas 的绘制接口”。
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.filter = 'contrast(1.06) saturate(0.9) brightness(1.04)';
      ctx.drawImage(stagingCanvas, 0, 0, width, height);
      ctx.restore();

      // 4) 极光裂隙：用 pointer 作为控制点，在预览层画一条“裂隙带”。
      //    白底展示下，为了避免 screen 直接趋近白色，这里用 multiply 做“染色”效果。
      const px = pointerRef.current.x * width;
      const py = pointerRef.current.y * height;
      const speed = Math.min(1, Math.sqrt(pointerRef.current.vx ** 2 + pointerRef.current.vy ** 2) * 1200);
      const pulse = 0.5 + 0.5 * Math.sin(time / 420);

      const r = Math.max(220, Math.min(width, height) * (0.24 + speed * 0.12));
      const aurora = ctx.createRadialGradient(px, py, r * 0.08, px, py, r);
      aurora.addColorStop(0, `rgba(95, 211, 177, ${0.34 + 0.22 * speed})`);
      aurora.addColorStop(0.42, `rgba(154, 124, 255, ${0.26 + 0.16 * pulse})`);
      aurora.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = aurora;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // 5) 粒子：不做对象池也行，直接用 deterministic 的 hash 生成一组“假粒子”。
      //    你会看到：canvas 可以很轻易地做出“成百上千个点”的动态效果。
      // 5) 粒子：在白底上尽量用 source-over（或 multiply），避免 lighter 过曝。
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 240; i += 1) {
        const seed = i * 10.7 + Math.floor(time / 20);
        const a = hash(seed) * Math.PI * 2;
        const d = r * (0.15 + 0.85 * hash(seed + 1.3));
        const x = px + Math.cos(a) * d;
        const y = py + Math.sin(a) * d;

        const life = hash(seed + 2.1);
        const alpha = softstep(1, 0, life) * (0.08 + 0.12 * speed);
        const size = 1 + 3.5 * hash(seed + 3.9);

        ctx.fillStyle = `rgba(24, 144, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 6) “色散”错位：把整张图的 RGB 轻微错位，模拟镜头色差。
      //    纯 2D context 里没有真正的 shader，但可以用 multi-pass 叠加做出类似感觉。
      const shift = 2 + 6 * speed + 2 * pulse;
      ctx.save();
      // 白底展示下，用 multiply 更像“彩色玻璃”叠印，而不是加色直接变白。
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.12;
      ctx.filter = 'hue-rotate(22deg) saturate(1.1)';
      ctx.drawImage(stagingCanvas, shift, 0, width, height);
      ctx.filter = 'hue-rotate(-18deg) saturate(1.1)';
      ctx.drawImage(stagingCanvas, -shift, 0, width, height);
      ctx.restore();

      // 7) 轻微的“扫描线”和暗角：白底展示时把强度降到很轻，避免出现“脏雾/光晕”的误解。
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 6) {
        ctx.beginPath();
        ctx.moveTo(0, y + (time / 40) % 6);
        ctx.lineTo(width, y + (time / 40) % 6);
        ctx.stroke();
      }
      ctx.restore();

      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.18,
        width * 0.5,
        height * 0.55,
        Math.max(width, height) * 0.82,
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // 8) 把这一帧写回 feedback 缓冲，给下一帧用。
      if (feedback) {
        feedback.ctx.setTransform(1, 0, 0, 1, 0, 0);
        feedback.ctx.clearRect(0, 0, width, height);
        feedback.ctx.drawImage(ctx.canvas, 0, 0, width, height);
      }
    };
  }, []);

  return (
    <HtmlInCanvasStage
      className="aurora-stage"
      surfaceClassName="aurora-stage__surface"
      sourceRootClassName="aurora-stage__source-root"
      source={<AuroraRiftSource {...props} />}
      fallback={<AuroraRiftSource {...props} />}
      previewRenderer={previewRenderer}
      repaintEvents={['scroll', 'input', 'change', 'focusin', 'pointerdown', 'pointerup', 'keydown']}
    />
  );
}
