import { screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { AuthState } from '@/features/auth/auth.slice';
import { renderWithProviders } from '@/test/utils';
import { ProtectedRoute } from './ProtectedRoute';

const user = {
  id: 'user-1',
  tenantId: 'tenant-1',
  email: 'member@example.com',
  displayName: 'Test Member',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderWithAuth(element: React.ReactNode, auth: AuthState, initialPath = '/private') {
  renderWithProviders(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={element} path="/private" />
        <Route element={<p>Login page</p>} path="/login" />
      </Routes>
    </MemoryRouter>,
    { preloadedState: { auth } },
  );
}

function authState(overrides: Partial<AuthState>): AuthState {
  return {
    currentUser: null,
    status: 'unauthenticated',
    loading: false,
    error: null,
    refreshToken: null,
    ...overrides,
  };
}

describe('route protection', () => {
  it('redirects unauthenticated users to login', () => {
    renderWithAuth(
      <ProtectedRoute>
        <p>Private page</p>
      </ProtectedRoute>,
      authState({}),
    );
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('shows a loading state while authentication is restoring', () => {
    renderWithAuth(
      <ProtectedRoute>
        <p>Private page</p>
      </ProtectedRoute>,
      authState({ status: 'restoring', loading: true }),
    );
    expect(screen.getByRole('status', { name: 'Restoring authentication' })).toBeInTheDocument();
  });

  it('allows authenticated users through protected routes', () => {
    renderWithAuth(
      <ProtectedRoute>
        <p>Private page</p>
      </ProtectedRoute>,
      authState({ currentUser: user, status: 'authenticated' }),
    );
    expect(screen.getByText('Private page')).toBeInTheDocument();
  });
});
