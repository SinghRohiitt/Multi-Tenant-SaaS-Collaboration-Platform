import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import { authReducer } from '@/features/auth/auth.slice';
import { TasksPage } from './TasksPage';

const useTasksMock = vi.hoisted(() => vi.fn());
vi.mock('@/features/tasks', () => ({
  TaskFormModal: () => null,
  TaskTable: () => null,
  useTasks: useTasksMock,
}));

function renderPage() {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <TasksPage />
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
});
