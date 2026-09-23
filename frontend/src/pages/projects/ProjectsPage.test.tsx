import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AuthState } from '@/features/auth/auth.slice';
import { renderWithProviders } from '@/test/utils';
import { ProjectsPage } from './ProjectsPage';

const useProjectsMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/projects', () => ({
  ProjectFormModal: () => null,
  ProjectTable: () => null,
  useProjects: useProjectsMock,
}));

function renderPage(role?: 'ADMIN' | 'MANAGER' | 'MEMBER') {
  const preloadedAuth: AuthState | undefined = role
    ? {
        currentUser: {
          id: 'user-1',
          tenantId: 'tenant-1',
          email: 'user@example.com',
          displayName: 'User',
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          role,
        },
        status: 'authenticated',
        loading: false,
        error: null,
        refreshToken: 'token',
      }
    : undefined;
  renderWithProviders(<ProjectsPage />, {
    preloadedState: preloadedAuth ? { auth: preloadedAuth } : undefined,
  });
}

const baseResult = {
  data: [],
  meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
  error: null,
  mutationError: null,
  mutationLoading: false,
  clearMutationError: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  archiveProject: vi.fn(),
};

describe('ProjectsPage states', () => {
  it('renders a loading state', () => {
    useProjectsMock.mockReturnValue({ ...baseResult, loading: true });
    renderPage();
    expect(screen.getByRole('status', { name: 'Loading projects' })).toBeInTheDocument();
  });

  it('renders an error state', () => {
    useProjectsMock.mockReturnValue({
      ...baseResult,
      error: 'Projects request failed',
      loading: false,
    });
    renderPage();
    expect(screen.getByText('Projects unavailable')).toBeInTheDocument();
    expect(screen.getByText('Projects request failed')).toBeInTheDocument();
  });

  it('renders an empty state', () => {
    useProjectsMock.mockReturnValue({ ...baseResult, loading: false });
    renderPage();
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
  });

  it('exposes create flow only to users who can manage the workspace', () => {
    useProjectsMock.mockReturnValue({ ...baseResult, loading: false });
    renderPage('ADMIN');
    expect(screen.getByRole('button', { name: 'New project' })).toBeInTheDocument();
  });

  it('does not expose project management to members', () => {
    useProjectsMock.mockReturnValue({ ...baseResult, loading: false });
    renderPage('MEMBER');
    expect(screen.queryByRole('button', { name: 'New project' })).not.toBeInTheDocument();
  });
});
