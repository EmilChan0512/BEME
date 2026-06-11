import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function VeilTransition({ effectName }) {
    return (_jsxs("div", { className: `veil-transition veil-transition--${effectName}`, children: [_jsx("div", { className: "veil-transition__glow" }), _jsx("div", { className: "veil-transition__panel veil-transition__panel--left" }), _jsx("div", { className: "veil-transition__panel veil-transition__panel--center" }), _jsx("div", { className: "veil-transition__panel veil-transition__panel--right" }), _jsx("div", { className: "veil-transition__line" })] }));
}
