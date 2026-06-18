import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../../layout/AppHeader';
import { HtmlInCanvasStage, type HtmlInCanvasPreviewRenderer } from '../HtmlInCanvasStage';
import { composeEffects } from '../effects/composeEffects';
import { createDomLayerEffect } from '../effects/createDomLayerEffect';
import { createScanlineEffect } from '../effects/createScanlineEffect';
import { createVignetteEffect } from '../effects/createVignetteEffect';
import { createWhiteBackgroundEffect } from '../effects/createWhiteBackgroundEffect';
import { useCanvasFlipRouteTransition } from '../../../hooks/animations/useCanvasFlipRouteTransition';
import { dateEntries } from '../../../config/dateEntries';
import './HomeRevealStage.css';

const HOME_DOM_LAYER_ALPHA = 0.98;
const HOME_DOM_LAYER_FILTER = 'contrast(1.04) saturate(1.02) brightness(1.01)';
const HOME_SCANLINE_STEP = 9;
const HOME_SCANLINE_SPEED_DIVISOR = 72;
const HOME_SCANLINE_ALPHA = 0.012;
const HOME_VIGNETTE_INNER_RATIO = 0.22;
const HOME_VIGNETTE_OUTER_RATIO = 0.92;
const HOME_VIGNETTE_ALPHA = 0.08;

function HomeRevealSource() {
  return (
    <section className="home-reveal-source">
      <div className="home-reveal-source__shell">
        <AppHeader />

        <section className="home-reveal-source__hero">
          <p className="home-reveal-source__eyebrow">Daily Log Index</p>
          <h1 className="home-reveal-source__title">Home Surface / 每日切面</h1>
          <p className="home-reveal-source__summary">
            首页现在也进入 html-in-canvas 体系。它不再只是一个静态入口，而是一块会被切开、翻面、重新显影的主舞台。
          </p>
        </section>

        <section className="home-reveal-source__grid" aria-label="Date entry overview">
          {dateEntries.map((entry) => (
            <Link key={entry.date} className="home-reveal-source__card" to={`/logs/${entry.date}`}>
              <p className="home-reveal-source__card-date">{entry.date}</p>
              <h2 className="home-reveal-source__card-title">{entry.title}</h2>
              <p className="home-reveal-source__card-summary">{entry.summary}</p>
            </Link>
          ))}
        </section>
      </div>
    </section>
  );
}

export function HomeRevealStage() {
  const { registerRouteTransitionCanvas } = useCanvasFlipRouteTransition();

  const previewRenderer = useMemo<HtmlInCanvasPreviewRenderer>(() => {
    const renderEffects = composeEffects([
      createWhiteBackgroundEffect(),
      createDomLayerEffect({
        alpha: HOME_DOM_LAYER_ALPHA,
        filter: HOME_DOM_LAYER_FILTER,
      }),
      createScanlineEffect({
        step: HOME_SCANLINE_STEP,
        speedDivisor: HOME_SCANLINE_SPEED_DIVISOR,
        alpha: HOME_SCANLINE_ALPHA,
      }),
      createVignetteEffect({
        innerRatio: HOME_VIGNETTE_INNER_RATIO,
        outerRatio: HOME_VIGNETTE_OUTER_RATIO,
        alpha: HOME_VIGNETTE_ALPHA,
      }),
    ]);

    return ({ ctx, stagingCanvas, sourceRoot, time, width, height }) => {
      renderEffects({ ctx, stagingCanvas, sourceRoot, time, width, height });
    };
  }, []);

  const handlePreviewCanvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      registerRouteTransitionCanvas('/', node);
    },
    [registerRouteTransitionCanvas],
  );

  const handlePreviewFrame = useCallback(
    (canvas: HTMLCanvasElement) => {
      registerRouteTransitionCanvas('/', canvas);
    },
    [registerRouteTransitionCanvas],
  );

  return (
    <HtmlInCanvasStage
      className="home-reveal-stage"
      surfaceClassName="home-reveal-stage__surface"
      sourceRootClassName="home-reveal-stage__source-root"
      previewCanvasRef={handlePreviewCanvasRef}
      onPreviewFrame={handlePreviewFrame}
      source={<HomeRevealSource />}
      fallback={<HomeRevealSource />}
      previewRenderer={previewRenderer}
      repaintEvents={['scroll', 'pointerdown', 'pointerup', 'keydown']}
    />
  );
}
