import type { PropsWithChildren } from 'react';
import { Outlet } from 'react-router-dom';

export type UserRole = 'admin' | 'manager' | 'member';

type RoleRouteProps = PropsWithChildren<{
  allowedRoles: UserRole[];
}>;

export function RoleRoute(props: RoleRouteProps) {
  return props.children ?? <Outlet />;
}
