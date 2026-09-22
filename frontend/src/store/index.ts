import { configureStore } from '@reduxjs/toolkit';
import { configureAuthInterceptors } from '@/services/api';
import { authReducer, clearSession, tokensRefreshed } from '@/features/auth/auth.slice';
import { notificationsReducer } from './slices/notifications.slice';
import { notify } from './slices/notifications.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
  },
});

configureAuthInterceptors({
  getRefreshToken: () => store.getState().auth.refreshToken,
  onTokensRefreshed: (tokens) => store.dispatch(tokensRefreshed(tokens)),
  onSessionExpired: () => {
    store.dispatch(clearSession());
    store.dispatch(
      notify({
        tone: 'warning',
        title: 'Session expired',
        message: 'Please sign in again to continue.',
      }),
    );
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
