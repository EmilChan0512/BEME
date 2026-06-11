import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation } from 'react-router-dom';
import { AppHeader } from './components/layout/AppHeader';
import { RouteTransitionOverlay } from './components/transitions/RouteTransitionOverlay';
import { RouteTransitionProgress } from './components/transitions/RouteTransitionProgress';
import { RouteTransitionProvider } from './components/transitions/RouteTransitionProvider';
import { AppRoutes } from './routes/AppRoutes';
export function App() {
    const location = useLocation();
    return (_jsx(RouteTransitionProvider, { location: location, children: (displayLocation) => {
            const isHomeRoute = displayLocation.pathname === '/';
            return (_jsxs("div", { className: "app-shell", children: [isHomeRoute ? _jsx(AppHeader, {}) : null, _jsx(RouteTransitionProgress, {}), _jsx("main", { className: isHomeRoute ? 'main main--home' : 'main main--log', children: _jsx(AppRoutes, { location: displayLocation }) }), _jsx(RouteTransitionOverlay, {})] }));
        } }));
}
