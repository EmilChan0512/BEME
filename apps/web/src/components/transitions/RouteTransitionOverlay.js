import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRouteTransition } from '../../hooks/animations/useRouteTransition';
function CurtainEffect() {
    return (_jsxs("div", { className: "route-transition__curtain", children: [_jsx("span", { className: "route-transition__panel" }), _jsx("span", { className: "route-transition__panel" }), _jsx("span", { className: "route-transition__panel" })] }));
}
function GridEffect() {
    return (_jsx("div", { className: "route-transition__grid", children: Array.from({ length: 16 }).map((_, index) => (_jsx("span", { className: "route-transition__cell", style: { '--cell-index': index } }, index))) }));
}
export function RouteTransitionOverlay() {
    const { cycle, durationMs, effect, isTransitioning, phase } = useRouteTransition();
    if (!isTransitioning) {
        return null;
    }
    return (_jsxs("div", { "aria-hidden": "true", className: `route-transition route-transition--${phase}`, style: {
            '--route-transition-duration': `${durationMs}ms`,
            '--route-transition-cycle': cycle,
        }, children: [_jsx("div", { className: "route-transition__backdrop" }), effect === 'curtain' ? _jsx(CurtainEffect, {}) : _jsx(GridEffect, {})] }));
}
