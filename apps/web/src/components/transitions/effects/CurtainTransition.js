import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRouteTransition } from '../../../hooks/animations/useRouteTransition';
export function CurtainTransition({ effectName }) {
    const { frames, grid, phase, phaseDurationMs } = useRouteTransition();
    if (!frames.currentSrc || !frames.nextSrc || phase === 'capturing' || phase === 'idle') {
        return null;
    }
    const activeFrame = phase === 'flipping-out' ? frames.currentSrc : frames.nextSrc;
    return (_jsxs("div", { className: `curtain-transition curtain-transition--${effectName}`, style: {
            '--route-transition-phase-duration': `${phaseDurationMs}ms`,
            '--curtain-transition-width': `${frames.width}px`,
            '--curtain-transition-height': `${frames.height}px`,
            '--curtain-columns': grid.columns,
        }, children: [_jsx("div", { className: "curtain-transition__frame", style: { backgroundImage: `url("${activeFrame}")` } }), _jsx("div", { className: "curtain-transition__panels", children: grid.tiles.map((tile) => (_jsx("span", { className: "curtain-transition__panel", style: {
                        '--tile-column': tile.column,
                        '--tile-delay': `${tile.delayMs}ms`,
                    } }, tile.id))) })] }));
}
