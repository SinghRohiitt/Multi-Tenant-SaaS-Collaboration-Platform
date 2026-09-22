import { useCallback, useMemo } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { notify, type NotificationTone } from '@/store/slices/notifications.slice';

export function useNotifications() {
  const dispatch = useAppDispatch();

  const show = useCallback(
    (tone: NotificationTone, title: string, message?: string) => {
      dispatch(notify({ tone, title, message }));
    },
    [dispatch],
  );

  return useMemo(
    () => ({
      success: (title: string, message?: string) => show('success', title, message),
      error: (title: string, message?: string) => show('error', title, message),
      warning: (title: string, message?: string) => show('warning', title, message),
      info: (title: string, message?: string) => show('info', title, message),
    }),
    [show],
  );
}
