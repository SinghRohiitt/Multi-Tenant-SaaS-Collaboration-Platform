import {
  Bell,
  Building2,
  CheckSquare,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Dropdown, Skeleton } from '@/components/ui';
import { logout } from '@/features/auth/auth.slice';
import type { UserRole } from '@/features/auth/auth.types';
import {
  selectAuthLoading,
  selectCanManageWorkspace,
  selectCurrentUser,
} from '@/features/auth/auth.selectors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

type NavigationItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
};

const navigation: NavigationItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', to: '/projects', icon: FolderKanban },
  { label: 'Tasks', to: '/tasks', icon: CheckSquare },
  { label: 'Members', to: '/members', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Settings', to: '/settings', icon: Settings, roles: ['ADMIN', 'MANAGER'] },
];

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const authLoading = useAppSelector(selectAuthLoading);
  const canManageWorkspace = useAppSelector(selectCanManageWorkspace);
  const visibleNavigation = navigation.filter((item) => !item.roles || canManageWorkspace);
  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => ({
      label: segment.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
      to: `/${segment}`,
    }));

  async function handleLogout() {
    await dispatch(logout());
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {mobileNavigationOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden"
          onClick={() => setMobileNavigationOpen(false)}
          type="button"
        />
      )}

      <aside
        aria-label="Sidebar navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-200 lg:translate-x-0 ${
          mobileNavigationOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div
            className={`flex items-center gap-3 overflow-hidden ${sidebarCollapsed ? 'lg:justify-center' : ''}`}
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-400 font-bold text-slate-950">
              C
            </div>
            <span
              className={`truncate text-sm font-semibold text-white ${sidebarCollapsed ? 'lg:hidden' : ''}`}
            >
              Collaboration
            </span>
          </div>
          <Button
            aria-label="Close navigation"
            className="lg:hidden"
            onClick={() => setMobileNavigationOpen(false)}
            size="sm"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className={`border-b border-slate-800 p-4 ${sidebarCollapsed ? 'lg:px-2' : ''}`}>
          {authLoading && !currentUser ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div
              className={`flex items-center gap-3 ${sidebarCollapsed ? 'lg:justify-center' : ''}`}
            >
              <Avatar name={currentUser?.displayName} size="sm" />
              <div className={`min-w-0 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                <p className="truncate text-sm font-medium text-slate-200">
                  {currentUser?.displayName ?? 'Workspace user'}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {currentUser?.email ?? 'Loading profile'}
                </p>
              </div>
            </div>
          )}
        </div>

        <nav aria-label="Primary navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
          <p
            className={`px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-600 ${sidebarCollapsed ? 'lg:hidden' : ''}`}
          >
            Workspace
          </p>
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                aria-label={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-400/10 text-cyan-300'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  } ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`
                }
                end={item.to === '/dashboard'}
                key={item.to}
                onClick={() => setMobileNavigationOpen(false)}
                to={item.to}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                <span className={sidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className={`border-t border-slate-800 p-3 ${sidebarCollapsed ? 'lg:px-2' : ''}`}>
          <div
            className={`flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
          >
            <Building2 aria-hidden="true" className="size-4 shrink-0 text-cyan-400" />
            <span
              className={`truncate text-xs text-slate-400 ${sidebarCollapsed ? 'lg:hidden' : ''}`}
            >
              {currentUser?.tenantId ?? 'Organization'}
            </span>
          </div>
        </div>
      </aside>

      <div
        className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}
      >
        <header className="sticky top-0 z-20 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                aria-label="Open navigation"
                className="lg:hidden"
                onClick={() => setMobileNavigationOpen(true)}
                size="sm"
                variant="ghost"
              >
                <Menu aria-hidden="true" className="size-5" />
              </Button>
              <Button
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="hidden lg:inline-flex"
                onClick={() => setSidebarCollapsed((value) => !value)}
                size="sm"
                variant="ghost"
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen aria-hidden="true" className="size-5" />
                ) : (
                  <PanelLeftClose aria-hidden="true" className="size-5" />
                )}
              </Button>
              <nav
                aria-label="Breadcrumb"
                className="hidden min-w-0 items-center gap-1 text-sm sm:flex"
              >
                <NavLink className="text-slate-500 hover:text-slate-300" to="/dashboard">
                  Home
                </NavLink>
                {breadcrumbs.map((crumb) => (
                  <span className="flex items-center gap-1" key={crumb.to}>
                    <ChevronRight aria-hidden="true" className="size-4 text-slate-700" />
                    <span className="truncate text-slate-300">{crumb.label}</span>
                  </span>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <Button aria-label="Notifications" className="relative" size="sm" variant="ghost">
                <Bell aria-hidden="true" className="size-5" />
                <Badge
                  className="absolute -right-0.5 -top-0.5 min-w-4 justify-center px-1 py-0 text-[10px]"
                  tone="info"
                >
                  0
                </Badge>
              </Button>
              <Dropdown
                label={
                  <>
                    <Avatar name={currentUser?.displayName} size="sm" />
                    <span className="hidden max-w-32 truncate sm:inline">
                      {currentUser?.displayName ?? 'Profile'}
                    </span>
                  </>
                }
              >
                <div className="border-b border-slate-800 px-3 py-2">
                  <p className="truncate text-sm font-medium text-slate-200">
                    {currentUser?.displayName ?? 'Workspace user'}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {currentUser?.email ?? 'Profile'}
                  </p>
                </div>
                <NavLink
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  to="/settings"
                >
                  <Settings aria-hidden="true" className="size-4" /> Settings
                </NavLink>
                <button
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-rose-300 hover:bg-slate-800"
                  onClick={() => void handleLogout()}
                  type="button"
                >
                  <LogOut aria-hidden="true" className="size-4" /> Sign out
                </button>
              </Dropdown>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
