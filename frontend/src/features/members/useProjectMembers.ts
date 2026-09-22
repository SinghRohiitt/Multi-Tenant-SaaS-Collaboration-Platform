import { useCallback, useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { getApiErrorMessage } from '@/services/api';
import { membersApi, type AddMemberPayload } from '@/services/members.api';
import type { PaginationMeta, ProjectMember } from '@/types/api';

const emptyMeta: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

export function useProjectMembers(projectId: string | undefined, page: number, limit = 20) {
  const notifications = useNotifications();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) {
      setMembers([]);
      setMeta(emptyMeta);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    membersApi
      .listByProject(projectId, { page, limit })
      .then((response) => {
        if (!cancelled) {
          setMembers(response.data);
          setMeta(response.meta);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          const message = getApiErrorMessage(requestError, 'Unable to load project members');
          setError(message);
          notifications.error('Members unavailable', message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit, notifications, page, projectId, reloadKey]);

  async function runMutation(action: () => Promise<unknown>, successTitle: string) {
    setMutationLoading(true);
    setMutationError(null);
    try {
      await action();
      reload();
      notifications.success(successTitle);
      return true;
    } catch (requestError) {
      setMutationError(getApiErrorMessage(requestError, 'Unable to update project members'));
      notifications.error(
        'Member action failed',
        getApiErrorMessage(requestError, 'Unable to update project members'),
      );
      return false;
    } finally {
      setMutationLoading(false);
    }
  }

  return {
    members,
    meta,
    loading,
    error,
    mutationLoading,
    mutationError,
    clearMutationError: () => setMutationError(null),
    reload,
    addMember: (payload: AddMemberPayload) =>
      runMutation(() => membersApi.add(projectId!, payload), 'Member added'),
    removeMember: (userId: string) =>
      runMutation(() => membersApi.remove(projectId!, userId), 'Member removed'),
  };
}
