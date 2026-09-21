import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/services/api';
import { membersApi, type AddMemberPayload } from '@/services/members.api';
import type { PaginationMeta, ProjectMember } from '@/types/api';

const emptyMeta: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

export function useProjectMembers(projectId: string | undefined, page: number, limit = 20) {
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
        if (!cancelled)
          setError(getApiErrorMessage(requestError, 'Unable to load project members'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit, page, projectId, reloadKey]);

  async function runMutation(action: () => Promise<unknown>) {
    setMutationLoading(true);
    setMutationError(null);
    try {
      await action();
      reload();
      return true;
    } catch (requestError) {
      setMutationError(getApiErrorMessage(requestError, 'Unable to update project members'));
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
      runMutation(() => membersApi.add(projectId!, payload)),
    removeMember: (userId: string) => runMutation(() => membersApi.remove(projectId!, userId)),
  };
}
