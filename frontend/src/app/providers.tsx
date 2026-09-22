import { useEffect, type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { restoreAuth } from '@/features/auth/auth.slice';
import { useAppDispatch } from '@/store/hooks';
import { store } from '@/store';
import { useNotifications } from '@/hooks/useNotifications';

function AuthBootstrap({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const notifications = useNotifications();

  useEffect(() => {
    dispatch(restoreAuth()).then((result) => {
      if (restoreAuth.rejected.match(result)) {
        notifications.warning(
          'Session could not be restored',
          result.payload ?? 'Please sign in again.',
        );
      }
    });
  }, [dispatch, notifications]);

  return children;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </Provider>
  );
}
