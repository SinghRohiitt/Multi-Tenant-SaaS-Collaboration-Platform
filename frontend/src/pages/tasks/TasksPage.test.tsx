import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { authReducer, type AuthState } from '@/features/auth/auth.slice';
import { TasksPage } from './TasksPage';

const useTasksMock = vi.hoisted(() => vi.fn());
vi.mock('@/features/tasks', () => ({
  TaskFormModal: () => null,
  TaskTable: () => null,
  useTasks: useTasksMock,
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
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: preloadedAuth ? { auth: preloadedAuth } : undefined,
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    </Provider>,
  );
}

const baseResult = {
  tasks: [],
  projects: [],
  meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
  error: null,
  mutationError: null,
  mutationLoading: false,
  clearMutationError: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  archiveTask: vi.fn(),
  reload: vi.fn(),
};

describe('TasksPage states', () => {
  it('renders loading state', () => {
    useTasksMock.mockReturnValue({ ...baseResult, loading: true });
    renderPage();
    expect(screen.getByRole('status', { name: 'Loading tasks' })).toBeInTheDocument();
  });
  it('renders error state', () => {
    useTasksMock.mockReturnValue({ ...baseResult, loading: false, error: 'Tasks request failed' });
    renderPage();
    expect(screen.getByText('Tasks unavailable')).toBeInTheDocument();
  });
  it('renders empty state', () => {
    useTasksMock.mockReturnValue({ ...baseResult, loading: false });
    renderPage();
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
  });

  it('exposes create flow only to users who can manage the workspace', () => {
    useTasksMock.mockReturnValue({ ...baseResult, loading: false });
    renderPage('ADMIN');
    expect(screen.getByRole('button', { name: 'New task' })).toBeInTheDocument();
  });

  it('does not expose task management to members', () => {
    useTasksMock.mockReturnValue({ ...baseResult, loading: false });
    renderPage('MEMBER');
    expect(screen.queryByRole('button', { name: 'New task' })).not.toBeInTheDocument();
  });
});
