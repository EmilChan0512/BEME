import { dateEntries } from './dateEntries';
export const navItems = dateEntries.map((entry) => ({
    to: `/logs/${entry.date}`,
    label: entry.date,
}));
