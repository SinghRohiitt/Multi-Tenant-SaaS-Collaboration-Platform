import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/services/api';
import { projectsApi } from '@/services/projects.api';
import {
  tasksApi,
  type CreateTaskPayload,
  type TaskListParams,
  type UpdateTaskPayload,
} from '@/services/tasks.api';
import type { PaginationMeta, Project, Task } from '@/types/api';

const PAGE_SIZE = 100;
const emptyMeta: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

type Page<T> = { data: T[]; meta: { totalPages: number } };

type TaskQuery = TaskListParams & { page: number; projectId?: string; limit?: number };

async function fetchAllPages<T>(fetchPage: (page: number) => Promise<Page<T>>) {
  const firstPage = await fetchPage(1);
  if (firstPage.meta.totalPages <= 1) return firstPage.data;
  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) => fetchPage(index + 2)),
  );
  return [firstPage.data, ...remainingPages.map((page) => page.data)].flat();
}

export function useTasks(query: TaskQuery) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const projectsCache = useRef<Project[] | null>(null);
  const pageSize = query.limit ?? 20;

  const reload = useCallback(() => {
    projectsCache.current = null;
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function loadTasks() {
      const projectList =
        projectsCache.current ??
        (await fetchAllPages((page) => projectsApi.list({ page, limit: PAGE_SIZE })));
      projectsCache.current = projectList;
      const selectedProjects = query.projectId
        ? projectList.filter((project) => project.id === query.projectId)
        : projectList;
      if (query.projectId) {
        const response = await tasksApi.listByProject(query.projectId, {
          page: query.page,
          limit: pageSize,
          search: query.search,
          status: query.status,
          priority: query.priority,
          assigneeId: query.assigneeId,
        });
        return { projects: projectList, tasks: response.data, meta: response.meta };
      }

      const taskLists = await Promise.all(
        selectedProjects.map((project) =>
          fetchAllPages((page) =>
            tasksApi.listByProject(project.id, {
              page,
              limit: PAGE_SIZE,
              search: query.search,
              status: query.status,
              priority: query.priority,
              assigneeId: query.assigneeId,
            }),
          ),
        ),
      );
      return { projects: projectList, tasks: taskLists.flat() };
    }

    loadTasks()
      .then(({ projects: projectList, tasks: taskList, meta: serverMeta }) => {
        if (cancelled) return;
        const start = (query.page - 1) * pageSize;
        setProjects(projectList);
        setTasks(serverMeta ? taskList : taskList.slice(start, start + pageSize));
        setMeta(
          serverMeta ?? {
            page: query.page,
            limit: pageSize,
            total: taskList.length,
            totalPages: Math.ceil(taskList.length / pageSize),
          },
        );
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(requestError, 'Unable to load tasks'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    pageSize,
    query.page,
    query.priority,
    query.projectId,
    query.search,
    query.status,
    query.assigneeId,
    reloadKey,
  ]);

  async function runMutation(action: () => Promise<unknown>) {
    setMutationLoading(true);
    setMutationError(null);
    try {
      await action();
      reload();
      return true;
    } catch (requestError) {
      setMutationError(getApiErrorMessage(requestError, 'Unable to update task'));
      return false;
    } finally {
      setMutationLoading(false);
    }
  }

  return {
    tasks,
    projects,
    meta,
    loading,
    error,
    mutationLoading,
    mutationError,
    clearMutationError: () => setMutationError(null),
    reload,
    createTask: (projectId: string, payload: CreateTaskPayload) =>
      runMutation(() => tasksApi.create(projectId, payload)),
    updateTask: (taskId: string, payload: UpdateTaskPayload) =>
      runMutation(() => tasksApi.update(taskId, payload)),
    assignTask: (taskId: string, assigneeId: string | null) =>
      runMutation(() => tasksApi.assign(taskId, assigneeId)),
    archiveTask: (taskId: string) => runMutation(() => tasksApi.archive(taskId)),
  };
}

export function useTask(taskId: string | undefined) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!taskId) {
      setTask(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    tasksApi
      .getById(taskId)
      .then((value) => {
        if (!cancelled) setTask(value);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(requestError, 'Unable to load task'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, taskId]);

  async function runMutation(action: () => Promise<unknown>) {
    setMutationLoading(true);
    setMutationError(null);
    try {
      await action();
      setReloadKey((key) => key + 1);
      return true;
    } catch (requestError) {
      setMutationError(getApiErrorMessage(requestError, 'Unable to update task'));
      return false;
    } finally {
      setMutationLoading(false);
    }
  }

  return {
    task,
    loading,
    error,
    mutationLoading,
    mutationError,
    retry: () => setReloadKey((key) => key + 1),
    updateTask: (payload: UpdateTaskPayload) =>
      runMutation(() => tasksApi.update(taskId!, payload)),
    assignTask: (assigneeId: string | null) =>
      runMutation(() => tasksApi.assign(taskId!, assigneeId)),
    archiveTask: () => runMutation(() => tasksApi.archive(taskId!)),
  };
}
