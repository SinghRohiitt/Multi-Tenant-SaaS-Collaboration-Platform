import { api } from './api';
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@/features/auth/auth.types';

type ApiResponse<T> = { success: true; data: T };

export const authApi = {
  async login(payload: LoginPayload) {
    const response = await api.post<ApiResponse<AuthSession>>('/auth/login', payload);
    return response.data.data;
  },
  async register(payload: RegisterPayload) {
    const response = await api.post<ApiResponse<AuthSession>>('/auth/register', payload);
    return response.data.data;
  },
  async refresh(refreshToken: string) {
    const response = await api.post<ApiResponse<Pick<AuthSession, 'accessToken' | 'refreshToken'>>>(
      '/auth/refresh',
      { refreshToken },
    );
    return response.data.data;
  },
  async logout(refreshToken: string) {
    await api.post('/auth/logout', { refreshToken });
  },
  async me() {
    const response = await api.get<ApiResponse<AuthUser>>('/auth/me');
    return response.data.data;
  },
};
