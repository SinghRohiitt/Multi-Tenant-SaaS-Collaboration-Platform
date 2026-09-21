import { useEffect, type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { restoreAuth } from '@/features/auth/auth.slice';
import { useAppDispatch } from '@/store/hooks';
import { store } from '@/store';

function AuthBootstrap({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(restoreAuth());
  }, [dispatch]);

  return children;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </Provider>
  );
}
