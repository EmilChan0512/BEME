import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRouteTransition } from '../../../hooks/animations/useRouteTransition';
export function NoiseRevealTransition({ effectName }) {
    const { frames, grid, phase, phaseDurationMs } = useRouteTransition();
    if (!frames.currentSrc || !frames.nextSrc || phase === 'capturing' || phase === 'idle') {
        return null;
    }
    return (_jsxs("div", { className: `noise-reveal-transition noise-reveal-transition--${effectName}`, style: {
            '--route-transition-phase-duration': `${phaseDurationMs}ms`,
            '--noise-width': `${frames.width}px`,
            '--noise-height': `${frames.height}px`,
            '--noise-columns': grid.columns,
            '--noise-rows': grid.rows,
        }, children: [_jsx("div", { className: `noise-reveal-transition__frame noise-reveal-transition__frame--current${phase === 'flipping-in' ? ' is-hidden' : ''}`, style: { backgroundImage: `url("${frames.currentSrc}")` } }), _jsx("div", { className: `noise-reveal-transition__frame noise-reveal-transition__frame--next${phase === 'flipping-in' ? ' is-visible' : ''}`, style: { backgroundImage: `url("${frames.nextSrc}")` } }), _jsx("div", { className: "noise-reveal-transition__noise", children: grid.tiles.map((tile) => (_jsx("span", { className: "noise-reveal-transition__particle", style: {
                        '--tile-column': tile.column,
                        '--tile-delay': `${tile.delayMs}ms`,
                        '--tile-row': tile.row,
                    } }, tile.id))) })] }));
}
