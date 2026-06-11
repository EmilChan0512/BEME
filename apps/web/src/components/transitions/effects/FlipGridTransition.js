import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRouteTransition } from '../../../hooks/animations/useRouteTransition';
export function FlipGridTransition({ effectName }) {
    const { frames, grid, phase, phaseDurationMs } = useRouteTransition();
    if (!frames.currentSrc || !frames.nextSrc || phase === 'capturing' || phase === 'idle') {
        return null;
    }
    return (_jsx("div", { className: `flip-grid-transition flip-grid-transition--${effectName}`, style: {
            '--route-transition-phase-duration': `${phaseDurationMs}ms`,
            '--flip-grid-width': `${frames.width}px`,
            '--flip-grid-height': `${frames.height}px`,
            '--flip-grid-columns': grid.columns,
            '--flip-grid-rows': grid.rows,
        }, children: _jsx("div", { className: "flip-grid-transition__surface", children: grid.tiles.map((tile) => (_jsx("div", { className: "flip-grid-transition__tile", style: {
                    '--tile-column': tile.column,
                    '--tile-delay': `${tile.delayMs}ms`,
                    '--tile-row': tile.row,
                }, children: _jsxs("div", { className: "flip-grid-transition__card", children: [_jsx("span", { className: "flip-grid-transition__face flip-grid-transition__face--current", style: { backgroundImage: `url("${frames.currentSrc}")` } }), _jsx("span", { className: "flip-grid-transition__face flip-grid-transition__face--black" }), _jsx("span", { className: "flip-grid-transition__face flip-grid-transition__face--next", style: { backgroundImage: `url("${frames.nextSrc}")` } })] }) }, tile.id))) }) }));
}
