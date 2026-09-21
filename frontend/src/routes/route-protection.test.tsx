import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { authReducer, type AuthState } from '@/features/auth/auth.slice';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

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
  const store = configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={element} path="/private" />
          <Route element={<p>Login page</p>} path="/login" />
          <Route element={<p>Unauthorized page</p>} path="/unauthorized" />
        </Routes>
      </MemoryRouter>
    </Provider>,
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

  it('allows an authenticated user with an allowed role', () => {
    renderWithAuth(
      <RoleRoute allowedRoles={['MEMBER']}>
        <p>Member page</p>
      </RoleRoute>,
      authState({ currentUser: { ...user, role: 'MEMBER' }, status: 'authenticated' }),
    );
    expect(screen.getByText('Member page')).toBeInTheDocument();
  });

  it('redirects an authenticated user without the required role', () => {
    renderWithAuth(
      <RoleRoute allowedRoles={['ADMIN']}>
        <p>Admin page</p>
      </RoleRoute>,
      authState({ currentUser: { ...user, role: 'MEMBER' }, status: 'authenticated' }),
    );
    expect(screen.getByText('Unauthorized page')).toBeInTheDocument();
  });
});
