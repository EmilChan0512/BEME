import { Route, Routes } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { DatePage } from '../pages/DatePage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';

type AppRoutesProps = {
  location?: Location;
};

export function AppRoutes({ location }: AppRoutesProps) {
  return (
    <Routes location={location}>
      <Route path="/" element={<HomePage />} />
      <Route path="/logs/:entryDate" element={<DatePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
