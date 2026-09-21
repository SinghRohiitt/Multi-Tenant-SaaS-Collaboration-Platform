import type { PropsWithChildren } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const status = useAppSelector((state) => state.auth.status);

  if (status !== 'authenticated') {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return children ?? <Outlet />;
}
