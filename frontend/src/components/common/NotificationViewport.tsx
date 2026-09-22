import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissNotification } from '@/store/slices/notifications.slice';
import { Toast } from '@/components/ui';

export function NotificationViewport() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications.items);

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-3 sm:left-auto sm:max-w-sm"
      role="region"
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => dispatch(dismissNotification(notification.id))}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: {
    id: string;
    tone: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
  };
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, notification.duration ?? 5000);
    return () => window.clearTimeout(timeout);
  }, [notification.duration, onDismiss]);

  return (
    <div className="pointer-events-auto w-full sm:w-96">
      <Toast
        message={notification.message}
        onClose={onDismiss}
        title={notification.title}
        tone={notification.tone}
      />
    </div>
  );
}
