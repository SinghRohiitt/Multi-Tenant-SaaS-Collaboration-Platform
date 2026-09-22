import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError, ApiSuccess } from '@/types/api';
import { getSafeApiErrorMessage } from './api-error';

let accessToken: string | null = null;
let refreshTokenGetter: (() => string | null) | null = null;
let onTokensRefreshed: ((tokens: RefreshResponse) => void) | null = null;
let onSessionExpired: (() => void) | null = null;
let refreshPromise: Promise<RefreshResponse> | null = null;

type RefreshResponse = { accessToken: string; refreshToken: string };
type RetryConfig = InternalAxiosRequestConfig & { _authRetry?: boolean };
type ApiResponse<T> = ApiSuccess<T>;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function configureAuthInterceptors(options: {
  getRefreshToken: () => string | null;
  onTokensRefreshed: (tokens: RefreshResponse) => void;
  onSessionExpired: () => void;
}) {
  refreshTokenGetter = options.getRefreshToken;
  onTokensRefreshed = options.onTokensRefreshed;
  onSessionExpired = options.onSessionExpired;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong') {
  return getSafeApiErrorMessage(error, fallback);
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const config = error.config as RetryConfig | undefined;
    const isAuthRequest = config?.url?.includes('/auth/');
    const refreshToken = refreshTokenGetter?.();

    if (
      error.response?.status !== 401 ||
      !config ||
      config._authRetry ||
      isAuthRequest ||
      !refreshToken
    ) {
      return Promise.reject(error);
    }

    try {
      refreshPromise ??= refreshClient
        .post<ApiResponse<RefreshResponse>>('/auth/refresh', { refreshToken })
        .then((response) => response.data.data)
        .finally(() => {
          refreshPromise = null;
        });

      const tokens = await refreshPromise;
      setAccessToken(tokens.accessToken);
      onTokensRefreshed?.(tokens);
      config._authRetry = true;
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api.request(config);
    } catch (refreshError) {
      setAccessToken(null);
      onSessionExpired?.();
      return Promise.reject(refreshError);
    }
  },
);
