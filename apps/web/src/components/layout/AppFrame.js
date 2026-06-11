import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getSiteThemeCssVariables } from '../../config/site';
import { AppHeader } from './AppHeader';
export function AppFrame({ activePath, children }) {
    return (_jsx("div", { className: "app-shell", style: getSiteThemeCssVariables(), children: _jsxs("div", { className: "app-shell__viewport", children: [_jsx(AppHeader, { activePath: activePath }), _jsx("main", { className: "main", children: children })] }) }));
}
