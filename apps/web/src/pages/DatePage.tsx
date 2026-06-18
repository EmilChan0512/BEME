import { Navigate, useParams } from 'react-router-dom';
import { FullscreenInkCanvasStage } from '../components/html-in-canvas/FullscreenInkCanvasStage';
import { AuroraRiftStage } from '../components/html-in-canvas/presets/AuroraRiftStage';
import { getDateEntry } from '../config/dateEntries';
import './DatePage.css';

export function DatePage() {
  const { entryDate } = useParams<{ entryDate: string }>();
  const entry = entryDate ? getDateEntry(entryDate) : null;

  if (!entryDate) {
    return <Navigate to="/" replace />;
  }

  if (!entry) {
    return <Navigate to="/" replace />;
  }

  if (entry.date === '20260616') {
    return <FullscreenInkCanvasStage {...entry} />;
  }

  if (entry.date === '20260618') {
    return <AuroraRiftStage {...entry} />;
  }

  return <section className="date-page-background" aria-hidden="true" />;
}
