import { useMemo, useRef } from 'react';
import { HtmlInCanvasStage, type HtmlInCanvasPreviewRenderer } from '../HtmlInCanvasStage';
import { AuroraCanvasActionMenu } from '../AuroraCanvasActionMenu';
import { AuroraMusicCanvasButton } from '../AuroraMusicCanvasButton';
import { composeEffects } from '../effects/composeEffects';
import { createDomLayerEffect } from '../effects/createDomLayerEffect';
import { createLaserSelectionEffect } from '../effects/createLaserSelectionEffect';
import { createParticleFieldEffect } from '../effects/createParticleFieldEffect';
import { createPixelJitterEffect } from '../effects/createPixelJitterEffect';
import { createPortraitBackgroundEffect } from '../effects/createPortraitBackgroundEffect';
import { createPointerAuroraEffect } from '../effects/createPointerAuroraEffect';
import { createScanlineEffect } from '../effects/createScanlineEffect';
import {
  createScrollFeedbackEffect,
  type ScrollFeedbackEffect,
} from '../effects/createScrollFeedbackEffect';
import { createScrollChromaticEffect } from '../effects/createScrollChromaticEffect';
import { createVignetteEffect } from '../effects/createVignetteEffect';
import { createWhiteBackgroundEffect } from '../effects/createWhiteBackgroundEffect';
import { useCanvasFlipRouteTransition } from '../../../hooks/animations/useCanvasFlipRouteTransition';
import { useGlobalBgm } from '../../../hooks/audio/useGlobalBgm';
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

type AuroraRiftSourceProps = AuroraRiftStageProps & {
  onToggleMusic: () => void;
  isMusicPlaying: boolean;
  musicStatusText: string;
  getFrequencyData: () => Uint8Array | null;
};

const PORTRAIT_IMAGE_SRC = `${import.meta.env.BASE_URL}aurora-portrait.png`;
const BACKGROUND_PATTERN_IMAGE_SRC = `${import.meta.env.BASE_URL}aurora-background-pattern.png`;

// 视觉调参区：
// 把“画面长什么样”的主要参数集中放在这里，后面调拖影、光圈、粒子、
// 色散和暗角时，不需要再进渲染逻辑里到处找数字。
// FEEDBACK_*：控制上一帧回写，也就是拖影/残影/回卷感。
// - shrink 越小：上一帧缩得越厉害，回卷感越强
// - alpha 越大：残影保留越久，但也更容易脏
const FEEDBACK_SHRINK = 0.092;
const FEEDBACK_ALPHA = 0.024;
const FEEDBACK_SCROLL_DECAY_MS = 320;
const FEEDBACK_SCROLL_MIN_DELTA = 0.18;
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
// BACKGROUND_PATTERN_*：控制主体背景图层，优先级低于头像层。
const BACKGROUND_PATTERN_ALPHA = 0.07;
const BACKGROUND_PATTERN_GLOW_ALPHA = 0.05;
const BACKGROUND_PATTERN_MAX_WIDTH_RATIO = 0.92;
const BACKGROUND_PATTERN_MAX_HEIGHT_RATIO = 0.88;
const BACKGROUND_PATTERN_CENTER_X_RATIO = 0.5;
const BACKGROUND_PATTERN_CENTER_Y_RATIO = 0.52;
const BACKGROUND_PATTERN_WHITE_THRESHOLD = 0.12;
// PORTRAIT_*：控制右下角头像层的位置、透明度和提取阈值。
// - alpha / glow alpha 越大：头像线稿越显眼
// - max width / height ratio：控制头像在画布中占多大
// - center x / y ratio：控制头像整体位置
// - white threshold 越大：越多浅灰区域会被抠成透明
const PORTRAIT_ALPHA = 0.2;
const PORTRAIT_GLOW_ALPHA = 0.11;
const PORTRAIT_MAX_WIDTH_RATIO = 0.34;
const PORTRAIT_MAX_HEIGHT_RATIO = 0.64;
const PORTRAIT_CENTER_X_RATIO = 0.79;
const PORTRAIT_CENTER_Y_RATIO = 0.76;
const PORTRAIT_WHITE_THRESHOLD = 0.17;
// AURORA_*：控制跟随鼠标的极光光圈。
// - base radius ratio 越大：鼠标静止时，光圈基础范围越大
// - speed radius boost 越大：鼠标移动越快时，光圈膨胀得越明显
// - inner stop 越小：中心高亮越集中、越“刺”
// - center/mid alpha 越大：青绿/紫色层越明显
// - speed/pulse boost 越大：对速度/呼吸脉冲越敏感
// - pressed radius scale 越小：鼠标按下时收缩得越明显；松开就立刻恢复
const AURORA_BASE_RADIUS_RATIO = 0.26;
const AURORA_SPEED_RADIUS_BOOST = 0.36;
const AURORA_INNER_STOP = 0.08;
const AURORA_CENTER_GREEN_ALPHA = 0.46;
const AURORA_CENTER_SPEED_BOOST = 0.3;
const AURORA_MID_PURPLE_ALPHA = 0.4;
const AURORA_MID_PULSE_BOOST = 0.28;
const AURORA_PRESSED_RADIUS_SCALE = 0.52;
const AURORA_LAYER_ALPHA = 0.96;
// PARTICLE_*：控制粒子层的数量感和可见度。
// - count / alpha 越大：能量场更丰富，但也更容易杂
// - size boost 越大：粒子尺寸差异越明显，更有闪烁感
const PARTICLE_COUNT = 56;
const PARTICLE_ALPHA_BASE = 0.1;
const PARTICLE_ALPHA_SPEED_BOOST = 0.16;
const PARTICLE_SIZE_BASE = 1;
const PARTICLE_SIZE_BOOST = 1.4;
// CHROMATIC_*：控制色散/彩边/双影效果。
// - shift 越大：彩色分离越明显
// - alpha 越大：彩边叠印越强，更容易有“玻璃印刷”感
const CHROMATIC_SHIFT_BASE = 3;
const CHROMATIC_SHIFT_SPEED_BOOST = 10;
const CHROMATIC_SHIFT_PULSE_BOOST = 3.2;
const CHROMATIC_ALPHA = 0.22;
const CHROMATIC_POSITIVE_FILTER = 'contrast(1.16) saturate(2.25) hue-rotate(-42deg)';
const CHROMATIC_NEGATIVE_FILTER = 'contrast(1.1) saturate(2.4) hue-rotate(110deg)';
const CHROMATIC_DIRECTION = 'vertical' as const;
// PIXEL_JITTER_*：控制赛博朋克式像素切片抖动/位移偏差。
// - region count 越大：横向分栏越细
// - active chance 越小：越像偶发性的局部故障
// - burst duration 越小：产生偏差后回正越快
// - max offset x/y 越大：位移偏差越明显
// - alpha 越大：整体故障层越抢眼
// - time step 越小：抖动更新越快
const PIXEL_JITTER_REGION_COUNT = 10;
const PIXEL_JITTER_ACTIVE_CHANCE = 0.28;
const PIXEL_JITTER_BURST_DURATION_MS = 260;
const PIXEL_JITTER_MAX_OFFSET_X = 8;
const PIXEL_JITTER_MAX_OFFSET_Y = 24;
const PIXEL_JITTER_ALPHA = 0.24;
const PIXEL_JITTER_TIME_STEP_MS = 2200;
const PIXEL_JITTER_PRIMARY_FILTER = 'contrast(1.24) saturate(2.8) hue-rotate(-34deg)';
const PIXEL_JITTER_SECONDARY_FILTER = 'contrast(1.18) saturate(2.65) hue-rotate(118deg)';
// SCANLINE_*：控制扫描线纹理，让画面更像“显示表面”。
// - step 越小：线越密
// - divisor 越小：扫描线漂移速度越快
const SCANLINE_STEP = 5;
const SCANLINE_SPEED_DIVISOR = 28;
const SCANLINE_ALPHA = 0.045;
const SCANLINE_PRIMARY_COLOR = 'rgb(255, 77, 214)';
const SCANLINE_SECONDARY_COLOR = 'rgb(69, 255, 224)';
// VIGNETTE_*：控制边缘压暗，也就是暗角。
// - inner ratio 越大：暗角从离中心更远的位置开始
// - outer ratio 越大：暗角更贴近画面边缘
// - alpha 越大：画框感/聚光感越强
const VIGNETTE_INNER_RATIO = 0.06;
const VIGNETTE_OUTER_RATIO = 0.86;
const VIGNETTE_ALPHA = 0.02;
const VIGNETTE_COLOR = 'rgba(98, 220, 237, 0.2)';

// 真实 DOM 内容层。
// 这部分并不是“截图素材”，它本身就是页面内容来源，staging canvas 只是把它重绘一遍。
function AuroraRiftSource({
  date,
  title,
  summary,
  note,
  highlights,
  onToggleMusic,
  isMusicPlaying,
  musicStatusText,
  getFrequencyData,
}: AuroraRiftSourceProps) {
  return (
    <section className="aurora-source hic-selection-theme--laser">
      <div className="aurora-source__paper">
        <div className="aurora-source__actions">
          <AuroraMusicCanvasButton
            isPlaying={isMusicPlaying}
            onToggle={onToggleMusic}
            getFrequencyData={getFrequencyData}
          />
        </div>
        <p className="aurora-source__music-status">{musicStatusText}</p>
        <p className="aurora-source__date">{date}</p>
        <h1 className="aurora-source__title">{title}</h1>
        {summary ? <p className="aurora-source__summary">{summary}</p> : null}

        {note || highlights.length > 0 ? <div className="aurora-source__divider" aria-hidden="true" /> : null}

        {note ? <p className="aurora-source__paragraph">{note}</p> : null}

        {highlights.length > 0 ? (
          <div className="aurora-source__card">
            <ul className="aurora-source__list">
              {highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="aurora-source__spacer" aria-hidden="true" />
      </div>
    </section>
  );
}
export function AuroraRiftStage(props: AuroraRiftStageProps) {
  const pointerRef = usePointerTracker();
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceRootRef = useRef<HTMLElement | null>(null);
  const { isTransitioning, startCanvasFlipRouteTransition } = useCanvasFlipRouteTransition();
  const {
    isPlaying: isMusicPlaying,
    statusText: musicStatusText,
    togglePlayback,
    getFrequencyData,
  } = useGlobalBgm();

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
    // 白底 -> 滚动拖影 -> DOM 内容 -> 主体背景纹样 -> 头像 -> 激光选区 -> 滚动色散 -> 像素撕裂 -> 鼠标极光 -> 粒子 -> 扫描线 -> 暗角。
    const renderEffects = composeEffects([
      createWhiteBackgroundEffect(),
      feedbackEffect.render,
      createDomLayerEffect({
        alpha: DOM_LAYER_ALPHA,
        filter: DOM_LAYER_FILTER,
      }),
      createPortraitBackgroundEffect({
        imageSrc: BACKGROUND_PATTERN_IMAGE_SRC,
        alpha: BACKGROUND_PATTERN_ALPHA,
        glowAlpha: BACKGROUND_PATTERN_GLOW_ALPHA,
        maxWidthRatio: BACKGROUND_PATTERN_MAX_WIDTH_RATIO,
        maxHeightRatio: BACKGROUND_PATTERN_MAX_HEIGHT_RATIO,
        centerXRatio: BACKGROUND_PATTERN_CENTER_X_RATIO,
        centerYRatio: BACKGROUND_PATTERN_CENTER_Y_RATIO,
        whiteThreshold: BACKGROUND_PATTERN_WHITE_THRESHOLD,
        fitMode: 'cover',
      }),
      createPortraitBackgroundEffect({
        imageSrc: PORTRAIT_IMAGE_SRC,
        alpha: PORTRAIT_ALPHA,
        glowAlpha: PORTRAIT_GLOW_ALPHA,
        maxWidthRatio: PORTRAIT_MAX_WIDTH_RATIO,
        maxHeightRatio: PORTRAIT_MAX_HEIGHT_RATIO,
        centerXRatio: PORTRAIT_CENTER_X_RATIO,
        centerYRatio: PORTRAIT_CENTER_Y_RATIO,
        whiteThreshold: PORTRAIT_WHITE_THRESHOLD,
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
        positiveFilter: CHROMATIC_POSITIVE_FILTER,
        negativeFilter: CHROMATIC_NEGATIVE_FILTER,
        direction: CHROMATIC_DIRECTION,
      }),
      createPixelJitterEffect({
        regionCount: PIXEL_JITTER_REGION_COUNT,
        activeChance: PIXEL_JITTER_ACTIVE_CHANCE,
        burstDurationMs: PIXEL_JITTER_BURST_DURATION_MS,
        maxOffsetX: PIXEL_JITTER_MAX_OFFSET_X,
        maxOffsetY: PIXEL_JITTER_MAX_OFFSET_Y,
        alpha: PIXEL_JITTER_ALPHA,
        timeStepMs: PIXEL_JITTER_TIME_STEP_MS,
        primaryFilter: PIXEL_JITTER_PRIMARY_FILTER,
        secondaryFilter: PIXEL_JITTER_SECONDARY_FILTER,
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
      createScanlineEffect({
        step: SCANLINE_STEP,
        speedDivisor: SCANLINE_SPEED_DIVISOR,
        alpha: SCANLINE_ALPHA,
        primaryColor: SCANLINE_PRIMARY_COLOR,
        secondaryColor: SCANLINE_SECONDARY_COLOR,
      }),
      createVignetteEffect({
        innerRatio: VIGNETTE_INNER_RATIO,
        outerRatio: VIGNETTE_OUTER_RATIO,
        alpha: VIGNETTE_ALPHA,
        color: VIGNETTE_COLOR,
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

  const handleReturnHome = (sourceElement: HTMLElement) => {
    if (isTransitioning) {
      return;
    }

    const rect = sourceElement.getBoundingClientRect();
    const originX = rect.left + rect.width * 0.5;
    const originY = rect.top + rect.height * 0.5;

    startCanvasFlipRouteTransition({
      to: '/',
      sourceCanvas: previewCanvasRef.current,
      origin: {
        x: originX / window.innerWidth,
        y: originY / window.innerHeight,
      },
    });
  };

  const handleScrollToTop = () => {
    sourceRootRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <HtmlInCanvasStage
        className="aurora-stage"
        surfaceClassName="aurora-stage__surface"
        sourceRootClassName="aurora-stage__source-root"
        sourceRootRef={sourceRootRef}
        previewCanvasRef={previewCanvasRef}
        source={
          <AuroraRiftSource
            {...props}
            onToggleMusic={togglePlayback}
            isMusicPlaying={isMusicPlaying}
            musicStatusText={musicStatusText}
            getFrequencyData={getFrequencyData}
          />
        }
        fallback={
          <AuroraRiftSource
            {...props}
            onToggleMusic={togglePlayback}
            isMusicPlaying={isMusicPlaying}
            musicStatusText={musicStatusText}
            getFrequencyData={getFrequencyData}
          />
        }
        previewRenderer={previewRenderer}
        repaintEvents={['scroll', 'input', 'change', 'focusin', 'pointerdown', 'pointerup', 'keydown']}
      />
      <AuroraCanvasActionMenu
        disabled={isTransitioning}
        onReturnHome={handleReturnHome}
        onScrollToTop={handleScrollToTop}
      />
    </>
  );
}
