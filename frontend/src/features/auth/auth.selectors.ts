import type { RootState } from '@/store';
import type { UserRole } from './auth.types';

export const selectAuth = (state: RootState) => state.auth;
export const selectCurrentUser = (state: RootState) => state.auth.currentUser;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

export const selectCurrentUserRoles = (state: RootState): UserRole[] => {
  const user = state.auth.currentUser;
  return user?.roles ?? (user?.role ? [user.role] : []);
};

export const selectCanManageWorkspace = (state: RootState) =>
  selectCurrentUserRoles(state).some((role) => role === 'ADMIN' || role === 'MANAGER');
