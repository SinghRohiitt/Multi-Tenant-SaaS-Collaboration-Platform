import { configureStore } from '@reduxjs/toolkit';
import { configureAuthInterceptors } from '@/services/api';
import { authReducer, clearSession, tokensRefreshed } from '@/features/auth/auth.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

configureAuthInterceptors({
  getRefreshToken: () => store.getState().auth.refreshToken,
  onTokensRefreshed: (tokens) => store.dispatch(tokensRefreshed(tokens)),
  onSessionExpired: () => store.dispatch(clearSession()),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
