import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthState } from './auth.slice';

const { login: loginRequest, register: registerRequest } = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
}));

vi.mock('@/services/auth.api', () => ({
  authApi: {
    login: loginRequest,
    register: registerRequest,
    refresh: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
  },
}));

const { authReducer, login, register } = await import('./auth.slice');

const user = {
  id: 'user-1',
  tenantId: 'tenant-1',
  email: 'member@example.com',
  displayName: 'Test Member',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const session = { user, accessToken: 'access-token', refreshToken: 'refresh-token' };

const postRestoreAuthState: AuthState = {
  currentUser: null,
  status: 'unauthenticated',
  loading: false,
  error: null,
  refreshToken: null,
};

function createStore() {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: postRestoreAuthState },
  });
}

describe('auth slice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores the user and session state after a successful login', async () => {
    loginRequest.mockResolvedValueOnce(session);
    const store = createStore();

    await store.dispatch(login({ tenantId: 'tenant-1', email: user.email, password: 'password' }));

    expect(store.getState().auth).toMatchObject({
      currentUser: user,
      status: 'authenticated',
      loading: false,
      error: null,
      refreshToken: 'refresh-token',
    });
  });

  it('exposes a safe error after a failed login', async () => {
    loginRequest.mockRejectedValueOnce(new Error('network failure'));
    const store = createStore();

    await store.dispatch(login({ tenantId: 'tenant-1', email: user.email, password: 'password' }));

    expect(store.getState().auth).toMatchObject({
      status: 'unauthenticated',
      loading: false,
      error: 'Unable to complete authentication request',
    });
  });

  it('authenticates a newly registered user', async () => {
    registerRequest.mockResolvedValueOnce(session);
    const store = createStore();

    await store.dispatch(
      register({
        tenantId: 'tenant-1',
        email: user.email,
        displayName: user.displayName,
        password: 'password',
      }),
    );

    expect(store.getState().auth.status).toBe('authenticated');
  });
});
