import { NavLink, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import type { UserRole } from '@/features/auth/auth.types';

const navigation = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Projects', to: '/projects' },
  { label: 'Tasks', to: '/tasks' },
];

export function DashboardLayout() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const roles: UserRole[] = currentUser?.roles ?? (currentUser?.role ? [currentUser.role] : []);
  const canManageMembers = roles.some((role) => role === 'ADMIN' || role === 'MANAGER');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold tracking-wide text-slate-300">
            Collaboration Platform
          </p>
          <nav aria-label="Primary navigation" className="flex flex-wrap gap-1">
            {[
              ...navigation,
              ...(canManageMembers ? [{ label: 'Members', to: '/members' }] : []),
            ].map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
