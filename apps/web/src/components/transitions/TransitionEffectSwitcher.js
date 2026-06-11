import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { routeTransitionEffectRegistry } from './effects/registry';
export function TransitionEffectSwitcher({ value, onChange, }) {
    return (_jsxs("div", { className: "transition-effect-switcher", children: [_jsx("label", { className: "transition-effect-switcher__label", htmlFor: "transition-effect-select", children: "\u8FC7\u6E21\u6548\u679C" }), _jsxs("select", { id: "transition-effect-select", className: "transition-effect-switcher__select", value: value, onChange: (event) => onChange(event.target.value), children: [_jsx("option", { value: "auto", children: "\u81EA\u52A8\u8F6E\u6362" }), routeTransitionEffectRegistry.map((effect) => (_jsx("option", { value: effect.name, children: effect.label }, effect.name)))] })] }));
}
