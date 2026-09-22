import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '@/services/auth.api';
import { getApiErrorMessage, setAccessToken } from '@/services/api';
import type { AuthSession, AuthUser, LoginPayload, RegisterPayload } from './auth.types';

export type AuthStatus = 'restoring' | 'unauthenticated' | 'authenticated';

export type AuthState = {
  currentUser: AuthUser | null;
  status: AuthStatus;
  loading: boolean;
  error: string | null;
  refreshToken: string | null;
};

const initialState: AuthState = {
  currentUser: null,
  status: 'restoring',
  loading: true,
  error: null,
  refreshToken: null,
};

function applySession(state: AuthState, session: AuthSession) {
  state.currentUser = session.user;
  state.status = 'authenticated';
  state.refreshToken = session.refreshToken;
  setAccessToken(session.accessToken);
}

function clearSessionState(state: AuthState) {
  state.currentUser = null;
  state.status = 'unauthenticated';
  state.loading = false;
  state.refreshToken = null;
  state.error = null;
  setAccessToken(null);
}

export const login = createAsyncThunk<AuthSession, LoginPayload, { rejectValue: string }>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.login(payload);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, 'Unable to complete authentication request'),
      );
    }
  },
);

export const register = createAsyncThunk<AuthSession, RegisterPayload, { rejectValue: string }>(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.register(payload);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, 'Unable to complete authentication request'),
      );
    }
  },
);

export const restoreAuth = createAsyncThunk<AuthSession | null, void, { rejectValue: string }>(
  'auth/restore',
  async (_, { getState, rejectWithValue }) => {
    const refreshToken = (getState() as { auth: AuthState }).auth.refreshToken;
    if (!refreshToken) return null;

    try {
      const tokens = await authApi.refresh(refreshToken);
      setAccessToken(tokens.accessToken);
      const user = await authApi.me();
      return { user, ...tokens };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Your session has expired'));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const refreshToken = (getState() as { auth: AuthState }).auth.refreshToken;
  if (refreshToken) await authApi.logout(refreshToken);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    clearSession(state) {
      clearSessionState(state);
    },
    tokensRefreshed(state, action: { payload: Pick<AuthSession, 'refreshToken'> }) {
      state.refreshToken = action.payload.refreshToken;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreAuth.pending, (state) => {
        state.loading = true;
        state.status = 'restoring';
        state.error = null;
      })
      .addCase(restoreAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          applySession(state, action.payload);
        } else {
          clearSessionState(state);
        }
      })
      .addCase(restoreAuth.rejected, (state, action) => {
        state.loading = false;
        state.status = 'unauthenticated';
        state.currentUser = null;
        state.refreshToken = null;
        state.error = action.payload ?? 'Your session has expired';
        setAccessToken(null);
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        applySession(state, action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to sign in';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        applySession(state, action.payload);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to create account';
      })
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        clearSessionState(state);
      })
      .addCase(logout.rejected, (state) => {
        clearSessionState(state);
      });
  },
});

export const { clearAuthError, clearSession, tokensRefreshed } = authSlice.actions;
export const authReducer = authSlice.reducer;
