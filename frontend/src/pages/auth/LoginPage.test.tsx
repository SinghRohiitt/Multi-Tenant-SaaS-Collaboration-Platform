import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthState } from '@/features/auth/auth.slice';
import { renderWithProviders } from '@/test/utils';
import { LoginPage } from './LoginPage';

const loginRequest = vi.hoisted(() => vi.fn());
vi.mock('@/services/auth.api', () => ({
  authApi: {
    login: loginRequest,
    register: vi.fn(),
    refresh: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
  },
}));

const session = {
  user: {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'member@example.com',
    displayName: 'Test Member',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

function renderLogin() {
  const preloadedAuth: AuthState = {
    currentUser: null,
    status: 'unauthenticated',
    loading: false,
    error: null,
    refreshToken: null,
  };
  const { store } = renderWithProviders(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<p>Dashboard destination</p>} path="/dashboard" />
      </Routes>
    </MemoryRouter>,
    { preloadedState: { auth: preloadedAuth } },
  );
  return store;
}

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('submits credentials and navigates after authentication', async () => {
    loginRequest.mockResolvedValueOnce(session);
    const user = userEvent.setup();
    const store = renderLogin();

    await user.type(screen.getByLabelText('Organization ID'), 'tenant-1');
    await user.type(screen.getByLabelText('Email address'), 'member@example.com');
    await user.type(screen.getByLabelText('Password'), 'password-1234');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('Dashboard destination')).toBeInTheDocument());
    expect(loginRequest).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      email: 'member@example.com',
      password: 'password-1234',
    });
    expect(store.getState().auth.status).toBe('authenticated');
  });

  it('shows validation feedback without calling the API', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Organization ID is required')).toBeInTheDocument();
    expect(loginRequest).not.toHaveBeenCalled();
  });
});
