import { useLocation } from 'react-router-dom';
import { CanvasFlipRouteTransitionProvider } from './components/transitions/CanvasFlipRouteTransitionProvider';
import { RouteTransitionOverlay } from './components/transitions/RouteTransitionOverlay';
import { RouteTransitionProgress } from './components/transitions/RouteTransitionProgress';
import { RouteTransitionProvider } from './components/transitions/RouteTransitionProvider';
import { GlobalBgmProvider } from './hooks/audio/useGlobalBgm';
import { AppRoutes } from './routes/AppRoutes';

function AppShell({ displayLocation }: { displayLocation: ReturnType<typeof useLocation> }) {
  const isHomeRoute = displayLocation.pathname === '/';

  return (
    <div className="app-shell">
      <RouteTransitionProgress />
      <main className={isHomeRoute ? 'main main--home' : 'main main--log'}>
        <AppRoutes location={displayLocation} />
      </main>
      <RouteTransitionOverlay />
    </div>
  );
}

export function App() {
  const location = useLocation();

  return (
    <GlobalBgmProvider>
      <CanvasFlipRouteTransitionProvider>
        <RouteTransitionProvider location={location}>
          {(displayLocation) => <AppShell displayLocation={displayLocation} />}
        </RouteTransitionProvider>
      </CanvasFlipRouteTransitionProvider>
    </GlobalBgmProvider>
  );
}
