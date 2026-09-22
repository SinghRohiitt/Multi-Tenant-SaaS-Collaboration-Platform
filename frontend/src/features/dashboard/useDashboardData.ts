import { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { getApiErrorMessage } from '@/services/api';
import { getDashboardData } from './dashboard.api';
import { buildDashboardMetrics } from './dashboard.utils';
import type { DashboardMetrics } from './dashboard.types';

export function useDashboardData() {
  const notifications = useNotifications();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getDashboardData()
      .then((data) => {
        if (!cancelled)
          setMetrics(buildDashboardMetrics(data.projects, data.tasks, data.members.length));
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          const message = getApiErrorMessage(requestError, 'Unable to load dashboard data');
          setError(message);
          notifications.error('Dashboard unavailable', message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [notifications, reloadKey]);

  return { metrics, loading, error, retry: () => setReloadKey((key) => key + 1) };
}
