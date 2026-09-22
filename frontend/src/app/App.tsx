import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@/routes/AppRoutes';
import { NotificationViewport } from '@/components/common/NotificationViewport';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <NotificationViewport />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
