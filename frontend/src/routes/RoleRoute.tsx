import type { PropsWithChildren } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import type { UserRole } from '@/features/auth/auth.types';

type RoleRouteProps = PropsWithChildren<{
  allowedRoles: UserRole[];
}>;

export function RoleRoute(props: RoleRouteProps) {
  const location = useLocation();
  const { currentUser, status } = useAppSelector((state) => state.auth);

  if (status === 'restoring') {
    return (
      <div className="grid min-h-48 place-items-center">
        <Spinner label="Restoring access" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  const userRoles = currentUser?.roles ?? (currentUser?.role ? [currentUser.role] : []);
  if (!props.allowedRoles.some((role) => userRoles.includes(role))) {
    return <Navigate replace state={{ from: location }} to="/unauthorized" />;
  }

  return props.children ?? <Outlet />;
}
