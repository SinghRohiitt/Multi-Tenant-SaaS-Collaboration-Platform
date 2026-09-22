import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@/routes/AppRoutes';
import { NotificationViewport } from '@/components/common/NotificationViewport';

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <NotificationViewport />
    </BrowserRouter>
  );
}
