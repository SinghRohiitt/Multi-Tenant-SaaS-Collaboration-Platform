import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import { authReducer } from '@/features/auth/auth.slice';
import { ProjectsPage } from './ProjectsPage';

const useProjectsMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/projects', () => ({
  ProjectFormModal: () => null,
  ProjectTable: () => null,
  useProjects: useProjectsMock,
}));

function renderPage() {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <ProjectsPage />
    </Provider>,
  );
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
});
