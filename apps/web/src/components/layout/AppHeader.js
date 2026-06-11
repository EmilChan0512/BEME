import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, NavLink } from 'react-router-dom';
import { navItems } from '../../config/navigation';
import './AppHeader.css';
export function AppHeader() {
    return (_jsx("header", { className: "header", children: _jsxs("div", { className: "header-shell", children: [_jsxs(Link, { className: "brand", to: "/", children: [_jsx("span", { className: "brand-mark", "aria-hidden": "true" }), _jsx("span", { className: "brand-text", children: "BEME" })] }), _jsx("nav", { className: "nav", "aria-label": "Daily entries", children: navItems.map((item) => (_jsx(NavLink, { to: item.to, className: ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link'), children: item.label }, item.to))) })] }) }));
}
