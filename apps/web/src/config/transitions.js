export const defaultRouteTransitionConfig = {
    effect: 'veil',
    label: 'Personal Veil',
    statusLabel: 'Page Transition',
    durationMs: 1500,
    coverRatio: 0.44,
    tokens: {
        backdropGlow: 'rgba(96, 165, 250, 0.22)',
        backdropBottom: 'rgba(2, 6, 23, 0.58)',
        statusBackground: 'rgba(15, 23, 42, 0.82)',
        statusBorder: 'rgba(255, 255, 255, 0.12)',
        statusColor: '#e2e8f0',
        glowPrimary: 'rgba(96, 165, 250, 0.28)',
        glowSecondary: 'rgba(59, 130, 246, 0.08)',
        panelEdgeStart: 'rgba(15, 23, 42, 0.98)',
        panelEdgeEnd: 'rgba(15, 23, 42, 0.88)',
        panelEdgeAccent: 'rgba(96, 165, 250, 0.18)',
        panelCenterStart: 'rgba(15, 23, 42, 0.96)',
        panelCenterEnd: 'rgba(30, 41, 59, 0.90)',
        panelCenterAccent: 'rgba(129, 140, 248, 0.20)',
        lineColor: 'rgba(191, 219, 254, 0.92)',
        lineShadow: 'rgba(191, 219, 254, 0.45)',
    },
    motion: {
        backdropInMs: 240,
        backdropOutMs: 320,
        glowInMs: 520,
        glowOutMs: 360,
        panelInMs: 620,
        panelOutMs: 520,
        lineInMs: 420,
        lineOutMs: 260,
        coverStaggerMs: [0, 70, 140],
        revealStaggerMs: [0, 45, 90],
    },
};
export const routeTransitionRouteOverrides = [
    {
        match: '/',
        config: {
            label: 'Home Veil',
            statusLabel: 'Landing',
            durationMs: 1650,
            tokens: {
                glowPrimary: 'rgba(125, 211, 252, 0.28)',
                glowSecondary: 'rgba(96, 165, 250, 0.10)',
            },
        },
    },
    {
        match: '/about',
        config: {
            statusLabel: 'About',
            durationMs: 1380,
            motion: {
                panelInMs: 560,
                panelOutMs: 460,
            },
        },
    },
    {
        match: '/contact',
        config: {
            statusLabel: 'Contact',
            durationMs: 1260,
            coverRatio: 0.40,
        },
    },
];
function matchesRoute(pathname, matcher) {
    if (matcher.endsWith('*')) {
        return pathname.startsWith(matcher.slice(0, -1));
    }
    return pathname === matcher;
}
function mergeTransitionConfig(base, override) {
    if (!override) {
        return base;
    }
    return {
        ...base,
        ...override,
        effect: override.effect ?? base.effect,
        tokens: {
            ...base.tokens,
            ...override.tokens,
        },
        motion: {
            ...base.motion,
            ...override.motion,
        },
    };
}
export function resolveRouteTransitionConfig({ to, }) {
    const override = routeTransitionRouteOverrides.find((rule) => matchesRoute(to.pathname, rule.match));
    return mergeTransitionConfig(defaultRouteTransitionConfig, override?.config);
}
export function getRouteTransitionCssVariables(config) {
    return {
        '--route-backdrop-glow': config.tokens.backdropGlow,
        '--route-backdrop-bottom': config.tokens.backdropBottom,
        '--route-status-background': config.tokens.statusBackground,
        '--route-status-border': config.tokens.statusBorder,
        '--route-status-color': config.tokens.statusColor,
        '--veil-glow-primary': config.tokens.glowPrimary,
        '--veil-glow-secondary': config.tokens.glowSecondary,
        '--veil-panel-edge-start': config.tokens.panelEdgeStart,
        '--veil-panel-edge-end': config.tokens.panelEdgeEnd,
        '--veil-panel-edge-accent': config.tokens.panelEdgeAccent,
        '--veil-panel-center-start': config.tokens.panelCenterStart,
        '--veil-panel-center-end': config.tokens.panelCenterEnd,
        '--veil-panel-center-accent': config.tokens.panelCenterAccent,
        '--veil-line-color': config.tokens.lineColor,
        '--veil-line-shadow': config.tokens.lineShadow,
        '--route-backdrop-in-ms': `${config.motion.backdropInMs}ms`,
        '--route-backdrop-out-ms': `${config.motion.backdropOutMs}ms`,
        '--veil-glow-in-ms': `${config.motion.glowInMs}ms`,
        '--veil-glow-out-ms': `${config.motion.glowOutMs}ms`,
        '--veil-panel-in-ms': `${config.motion.panelInMs}ms`,
        '--veil-panel-out-ms': `${config.motion.panelOutMs}ms`,
        '--veil-line-in-ms': `${config.motion.lineInMs}ms`,
        '--veil-line-out-ms': `${config.motion.lineOutMs}ms`,
        '--veil-cover-delay-0': `${config.motion.coverStaggerMs[0]}ms`,
        '--veil-cover-delay-1': `${config.motion.coverStaggerMs[1]}ms`,
        '--veil-cover-delay-2': `${config.motion.coverStaggerMs[2]}ms`,
        '--veil-reveal-delay-0': `${config.motion.revealStaggerMs[0]}ms`,
        '--veil-reveal-delay-1': `${config.motion.revealStaggerMs[1]}ms`,
        '--veil-reveal-delay-2': `${config.motion.revealStaggerMs[2]}ms`,
    };
}
