import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage, RegisterPage } from '@/pages/auth';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate replace to="/dashboard" />} />
          <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
          <Route path="/projects" element={<PlaceholderPage title="Projects" />} />
          <Route path="/tasks" element={<PlaceholderPage title="Tasks" />} />
          <Route element={<RoleRoute allowedRoles={['admin', 'manager']} />} path="/members">
            <Route index element={<PlaceholderPage title="Members" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
