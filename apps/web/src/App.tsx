import { useLocation } from 'react-router-dom';
import { AppHeader } from './components/layout/AppHeader';
import { RouteTransitionOverlay } from './components/transitions/RouteTransitionOverlay';
import { RouteTransitionProgress } from './components/transitions/RouteTransitionProgress';
import { RouteTransitionProvider } from './components/transitions/RouteTransitionProvider';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  const location = useLocation();

  return (
    <RouteTransitionProvider location={location}>
      {(displayLocation) => {
        const isHomeRoute = displayLocation.pathname === '/';

        return (
          <div className="app-shell">
            {isHomeRoute ? <AppHeader /> : null}
            <RouteTransitionProgress />
            <main className={isHomeRoute ? 'main main--home' : 'main main--log'}>
              <AppRoutes location={displayLocation} />
            </main>
            <RouteTransitionOverlay />
          </div>
        );
      }}
    </RouteTransitionProvider>
  );
}
