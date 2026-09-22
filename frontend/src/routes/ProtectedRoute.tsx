import type { PropsWithChildren } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { selectAuthStatus } from '@/features/auth/auth.selectors';
import { useAppSelector } from '@/store/hooks';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const status = useAppSelector(selectAuthStatus);

  if (status === 'restoring') {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
        <Spinner label="Restoring authentication" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return children ?? <Outlet />;
}
