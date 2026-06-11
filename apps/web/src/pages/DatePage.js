import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, useParams } from 'react-router-dom';
import { getDateEntry } from '../config/dateEntries';
import './DatePage.css';
export function DatePage() {
    const { entryDate } = useParams();
    if (!entryDate) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    const entry = getDateEntry(entryDate);
    if (!entry) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return _jsx("section", { className: "date-page-background", "aria-hidden": "true" });
}
