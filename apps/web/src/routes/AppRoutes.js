import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, Routes } from 'react-router-dom';
import { DatePage } from '../pages/DatePage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
export function AppRoutes({ location }) {
    return (_jsxs(Routes, { location: location, children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/logs/:entryDate", element: _jsx(DatePage, {}) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }));
}
