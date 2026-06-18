import { useMemo } from 'react';
import { HtmlInCanvasStage, type HtmlInCanvasPreviewRenderer } from '../HtmlInCanvasStage';
import { composeEffects } from '../effects/composeEffects';
import { createDomLayerEffect } from '../effects/createDomLayerEffect';
import { createLaserSelectionEffect } from '../effects/createLaserSelectionEffect';
import { createParticleFieldEffect } from '../effects/createParticleFieldEffect';
import { createPointerAuroraEffect } from '../effects/createPointerAuroraEffect';
import { createScanlineEffect } from '../effects/createScanlineEffect';
import {
  createScrollFeedbackEffect,
  type ScrollFeedbackEffect,
} from '../effects/createScrollFeedbackEffect';
import { createScrollChromaticEffect } from '../effects/createScrollChromaticEffect';
import { createVignetteEffect } from '../effects/createVignetteEffect';
import { createWhiteBackgroundEffect } from '../effects/createWhiteBackgroundEffect';
import { usePointerTracker } from '../hooks/usePointerTracker';
import '../selection/LaserSelectionTheme.css';
import './AuroraRiftStage.css';

type AuroraRiftStageProps = {
  date: string;
  title: string;
  summary: string;
  note: string;
  highlights: string[];
  tags: string[];
};

// 视觉调参区：
// 把“画面长什么样”的主要参数集中放在这里，后面调拖影、光圈、粒子、
// 色散和暗角时，不需要再进渲染逻辑里到处找数字。
// FEEDBACK_*：控制上一帧回写，也就是拖影/残影/回卷感。
// - shrink 越小：上一帧缩得越厉害，回卷感越强
// - alpha 越大：残影保留越久，但也更容易脏
const FEEDBACK_SHRINK = 0.1;
const FEEDBACK_ALPHA = 0.01;
const FEEDBACK_SCROLL_DECAY_MS = 220;
const FEEDBACK_SCROLL_MIN_DELTA = 0.25;
// DOM_LAYER_*：控制 HTML 内容层在特效层下面有多清楚。
// - alpha 越低：艺术层更抢眼，文字/内容更容易被压住
// - filter：调纸面、文字的对比度、饱和度和亮度
const DOM_LAYER_ALPHA = 0.9;
const DOM_LAYER_FILTER = 'contrast(1.06) saturate(0.9) brightness(1.04)';
// LASER_SELECTION_*：控制文本选中时的“激光切片”视觉。
// - fill alpha 越大：选区底层渐变越明显
// - line alpha / glow blur 越大：边缘激光感越强
// - stripe gap / stripe width：控制斜向切片纹理的密度
// - sweep speed divisor 越小：扫光移动越快
const LASER_SELECTION_FILL_ALPHA = 0.24;
const LASER_SELECTION_LINE_ALPHA = 0.78;
const LASER_SELECTION_GLOW_BLUR = 18;
const LASER_SELECTION_STRIPE_ALPHA = 0.16;
const LASER_SELECTION_STRIPE_GAP = 12;
const LASER_SELECTION_STRIPE_WIDTH = 4;
const LASER_SELECTION_RADIUS = 5;
const LASER_SELECTION_SWEEP_SPEED_DIVISOR = 2.6;
// AURORA_*：控制跟随鼠标的极光光圈。
// - base radius ratio 越大：鼠标静止时，光圈基础范围越大
// - speed radius boost 越大：鼠标移动越快时，光圈膨胀得越明显
// - inner stop 越小：中心高亮越集中、越“刺”
// - center/mid alpha 越大：青绿/紫色层越明显
// - speed/pulse boost 越大：对速度/呼吸脉冲越敏感
// - pressed radius scale 越小：鼠标按下时收缩得越明显；松开就立刻恢复
const AURORA_BASE_RADIUS_RATIO = 0.24;
const AURORA_SPEED_RADIUS_BOOST = 0.32;
const AURORA_INNER_STOP = 0.08;
const AURORA_CENTER_GREEN_ALPHA = 0.34;
const AURORA_CENTER_SPEED_BOOST = 0.22;
const AURORA_MID_PURPLE_ALPHA = 0.26;
const AURORA_MID_PULSE_BOOST = 0.16;
const AURORA_PRESSED_RADIUS_SCALE = 0.52;
const AURORA_LAYER_ALPHA = 0.72;
// PARTICLE_*：控制粒子层的数量感和可见度。
// - count / alpha 越大：能量场更丰富，但也更容易杂
// - size boost 越大：粒子尺寸差异越明显，更有闪烁感
const PARTICLE_COUNT = 40;
const PARTICLE_ALPHA_BASE = 0.08;
const PARTICLE_ALPHA_SPEED_BOOST = 0.12;
const PARTICLE_SIZE_BASE = 1;
const PARTICLE_SIZE_BOOST = 1;
// CHROMATIC_*：控制色散/彩边/双影效果。
// - shift 越大：彩色分离越明显
// - alpha 越大：彩边叠印越强，更容易有“玻璃印刷”感
const CHROMATIC_SHIFT_BASE = 2;
const CHROMATIC_SHIFT_SPEED_BOOST = 6;
const CHROMATIC_SHIFT_PULSE_BOOST = 2;
const CHROMATIC_ALPHA = 0.12;
// SCANLINE_*：控制扫描线纹理，让画面更像“显示表面”。
// - step 越小：线越密
// - divisor 越小：扫描线漂移速度越快
const SCANLINE_STEP = 6;
const SCANLINE_SPEED_DIVISOR = 40;
const SCANLINE_ALPHA = 0.02;
// VIGNETTE_*：控制边缘压暗，也就是暗角。
// - inner ratio 越大：暗角从离中心更远的位置开始
// - outer ratio 越大：暗角更贴近画面边缘
// - alpha 越大：画框感/聚光感越强
const VIGNETTE_INNER_RATIO = 0.18;
const VIGNETTE_OUTER_RATIO = 0.82;
const VIGNETTE_ALPHA = 0.12;

// 真实 DOM 内容层。
// 这部分并不是“截图素材”，它本身就是页面内容来源，staging canvas 只是把它重绘一遍。
function AuroraRiftSource({
  date,
  title,
  summary,
  note,
  highlights,
  tags,
}: AuroraRiftStageProps) {
  return (
    <section className="aurora-source hic-selection-theme--laser">
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
  const pointerRef = usePointerTracker();

  const previewRenderer = useMemo<HtmlInCanvasPreviewRenderer>(() => {
    // feedbackEffect 不是直接返回一个函数，而是拆成：
    // 1. render：当前帧里把上一帧按一定缩放叠回来
    // 2. persistFrame：当前帧结束后把结果缓存下来
    const feedbackEffect: ScrollFeedbackEffect = createScrollFeedbackEffect({
      shrink: FEEDBACK_SHRINK,
      alpha: FEEDBACK_ALPHA,
      decayMs: FEEDBACK_SCROLL_DECAY_MS,
      minDelta: FEEDBACK_SCROLL_MIN_DELTA,
    });

    // 这条流水线的顺序就是最终视觉层叠顺序：
    // 白底 -> 滚动拖影 -> DOM 内容 -> 鼠标极光 -> 粒子 -> 激光选区 -> 滚动色散 -> 扫描线 -> 暗角。
    const renderEffects = composeEffects([
      createWhiteBackgroundEffect(),
      feedbackEffect.render,
      createDomLayerEffect({
        alpha: DOM_LAYER_ALPHA,
        filter: DOM_LAYER_FILTER,
      }),
      createPointerAuroraEffect({
        pointerRef,
        baseRadiusRatio: AURORA_BASE_RADIUS_RATIO,
        speedRadiusBoost: AURORA_SPEED_RADIUS_BOOST,
        innerStop: AURORA_INNER_STOP,
        centerGreenAlpha: AURORA_CENTER_GREEN_ALPHA,
        centerSpeedBoost: AURORA_CENTER_SPEED_BOOST,
        midPurpleAlpha: AURORA_MID_PURPLE_ALPHA,
        midPulseBoost: AURORA_MID_PULSE_BOOST,
        pressedRadiusScale: AURORA_PRESSED_RADIUS_SCALE,
        layerAlpha: AURORA_LAYER_ALPHA,
      }),
      createParticleFieldEffect({
        pointerRef,
        count: PARTICLE_COUNT,
        alphaBase: PARTICLE_ALPHA_BASE,
        alphaSpeedBoost: PARTICLE_ALPHA_SPEED_BOOST,
        sizeBase: PARTICLE_SIZE_BASE,
        sizeBoost: PARTICLE_SIZE_BOOST,
        radiusBaseRatio: AURORA_BASE_RADIUS_RATIO,
        radiusSpeedBoost: AURORA_SPEED_RADIUS_BOOST,
      }),
      createLaserSelectionEffect({
        fillAlpha: LASER_SELECTION_FILL_ALPHA,
        lineAlpha: LASER_SELECTION_LINE_ALPHA,
        glowBlur: LASER_SELECTION_GLOW_BLUR,
        stripeAlpha: LASER_SELECTION_STRIPE_ALPHA,
        stripeGap: LASER_SELECTION_STRIPE_GAP,
        stripeWidth: LASER_SELECTION_STRIPE_WIDTH,
        radius: LASER_SELECTION_RADIUS,
        sweepSpeedDivisor: LASER_SELECTION_SWEEP_SPEED_DIVISOR,
      }),
      createScrollChromaticEffect({
        shiftBase: CHROMATIC_SHIFT_BASE,
        shiftSpeedBoost: CHROMATIC_SHIFT_SPEED_BOOST,
        shiftPulseBoost: CHROMATIC_SHIFT_PULSE_BOOST,
        alpha: CHROMATIC_ALPHA,
        decayMs: FEEDBACK_SCROLL_DECAY_MS,
        minDelta: FEEDBACK_SCROLL_MIN_DELTA,
      }),
      createScanlineEffect({
        step: SCANLINE_STEP,
        speedDivisor: SCANLINE_SPEED_DIVISOR,
        alpha: SCANLINE_ALPHA,
      }),
      createVignetteEffect({
        innerRatio: VIGNETTE_INNER_RATIO,
        outerRatio: VIGNETTE_OUTER_RATIO,
        alpha: VIGNETTE_ALPHA,
      }),
    ]);

    return ({ ctx, stagingCanvas, sourceRoot, time, width, height }) => {
      // 这里的 width / height 来自 HtmlInCanvasStage 传入的 preview canvas 实际像素尺寸，
      // 已经乘过 devicePixelRatio，所以不是 CSS 宽高。
      renderEffects({ ctx, stagingCanvas, sourceRoot, time, width, height });
      // 所有效果都画完后，再把整帧缓存起来，供下一帧做 scroll feedback。
      feedbackEffect.persistFrame(ctx.canvas as HTMLCanvasElement, width, height);
    };
  }, [pointerRef]);

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
