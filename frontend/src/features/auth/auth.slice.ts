import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { authApi } from '@/services/auth.api';
import { setAccessToken } from '@/services/api';
import type { AuthSession, AuthUser, LoginPayload, RegisterPayload } from './auth.types';

type AuthStatus = 'unauthenticated' | 'authenticated';

type AuthState = {
  currentUser: AuthUser | null;
  status: AuthStatus;
  loading: boolean;
  error: string | null;
  refreshToken: string | null;
};

const initialState: AuthState = {
  currentUser: null,
  status: 'unauthenticated',
  loading: false,
  error: null,
  refreshToken: null,
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data.message ?? 'Unable to complete authentication request';
  }
  return 'Unable to complete authentication request';
}

function applySession(state: AuthState, session: AuthSession) {
  state.currentUser = session.user;
  state.status = 'authenticated';
  state.refreshToken = session.refreshToken;
  setAccessToken(session.accessToken);
}

export const login = createAsyncThunk<AuthSession, LoginPayload, { rejectValue: string }>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.login(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const register = createAsyncThunk<AuthSession, RegisterPayload, { rejectValue: string }>(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.register(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
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
      state.currentUser = null;
      state.status = 'unauthenticated';
      state.refreshToken = null;
      state.error = null;
      setAccessToken(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
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
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.currentUser = null;
        state.status = 'unauthenticated';
        state.refreshToken = null;
        setAccessToken(null);
      })
      .addCase(logout.rejected, (state) => {
        state.loading = false;
        state.currentUser = null;
        state.status = 'unauthenticated';
        state.refreshToken = null;
        setAccessToken(null);
      });
  },
});

export const { clearAuthError, clearSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
