import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/services/api';
import {
  projectsApi,
  type CreateProjectPayload,
  type ProjectListParams,
  type UpdateProjectPayload,
} from '@/services/projects.api';
import type { PaginationMeta, Project } from '@/types/api';

const emptyMeta: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

type ProjectsResult = { data: Project[]; meta: PaginationMeta };

type ProjectQuery = ProjectListParams & { page: number };

export function useProjects(query: ProjectQuery) {
  const [result, setResult] = useState<ProjectsResult>({ data: [], meta: emptyMeta });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    projectsApi
      .list(query)
      .then((response) => {
        if (!cancelled) setResult(response);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(requestError, 'Unable to load projects'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query.page, query.limit, query.search, query.status, reloadKey]);

  async function runMutation(action: () => Promise<unknown>) {
    setMutationLoading(true);
    setMutationError(null);
    try {
      await action();
      reload();
      return true;
    } catch (requestError) {
      setMutationError(getApiErrorMessage(requestError, 'Unable to update project'));
      return false;
    } finally {
      setMutationLoading(false);
    }
  }

  return {
    ...result,
    loading,
    error,
    mutationLoading,
    mutationError,
    clearMutationError: () => setMutationError(null),
    reload,
    createProject: (payload: CreateProjectPayload) =>
      runMutation(() => projectsApi.create(payload)),
    updateProject: (projectId: string, payload: UpdateProjectPayload) =>
      runMutation(() => projectsApi.update(projectId, payload)),
    archiveProject: (projectId: string) => runMutation(() => projectsApi.archive(projectId)),
  };
}

export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    projectsApi
      .getById(projectId)
      .then((value) => {
        if (!cancelled) setProject(value);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(requestError, 'Unable to load project'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, reloadKey]);

  async function runMutation(action: () => Promise<unknown>) {
    setMutationLoading(true);
    setMutationError(null);
    try {
      await action();
      setReloadKey((key) => key + 1);
      return true;
    } catch (requestError) {
      setMutationError(getApiErrorMessage(requestError, 'Unable to update project'));
      return false;
    } finally {
      setMutationLoading(false);
    }
  }

  return {
    project,
    loading,
    error,
    mutationLoading,
    mutationError,
    retry: () => setReloadKey((key) => key + 1),
    updateProject: (payload: UpdateProjectPayload) =>
      runMutation(() => projectsApi.update(projectId!, payload)),
    archiveProject: () => runMutation(() => projectsApi.archive(projectId!)),
  };
}
