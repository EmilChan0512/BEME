import { useCallback, useMemo } from 'react';
import { AppHeader } from '../../layout/AppHeader';
import { HtmlInCanvasStage, type HtmlInCanvasPreviewRenderer } from '../HtmlInCanvasStage';
import { composeEffects } from '../effects/composeEffects';
import { createDomLayerEffect } from '../effects/createDomLayerEffect';
import { createWhiteBackgroundEffect } from '../effects/createWhiteBackgroundEffect';
import { useCanvasFlipRouteTransition } from '../../../hooks/animations/useCanvasFlipRouteTransition';
import './HomeRevealStage.css';

const HOME_DOM_LAYER_ALPHA = 1;
const HOME_DOM_LAYER_FILTER = 'none';

function HomeRevealSource() {
  return (
    <section className="home-reveal-source">
      <div className="home-reveal-source__shell">
        <AppHeader />
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
