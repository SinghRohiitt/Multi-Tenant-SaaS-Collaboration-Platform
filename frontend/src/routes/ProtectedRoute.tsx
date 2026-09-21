import type { PropsWithChildren } from 'react';
import { Outlet } from 'react-router-dom';

export function ProtectedRoute({ children }: PropsWithChildren) {
  return children ?? <Outlet />;
}
