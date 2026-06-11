import { Navigate, useParams } from 'react-router-dom';
import { getDateEntry } from '../config/dateEntries';
import './DatePage.css';

export function DatePage() {
  const { entryDate } = useParams<{ entryDate: string }>();

  if (!entryDate) {
    return <Navigate to="/" replace />;
  }

  const entry = getDateEntry(entryDate);

  if (!entry) {
    return <Navigate to="/" replace />;
  }

  return <section className="date-page-background" aria-hidden="true" />;
}
