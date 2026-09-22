import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listProjects, listByProject, create, update, archive, assign } = vi.hoisted(() => ({
  listProjects: vi.fn(),
  listByProject: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  archive: vi.fn(),
  assign: vi.fn(),
}));

const notifications = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));

vi.mock('@/services/projects.api', () => ({
  projectsApi: { list: listProjects },
}));

vi.mock('@/services/tasks.api', () => ({
  tasksApi: {
    listByProject,
    create,
    update,
    archive,
    assign,
    getById: vi.fn(),
  },
}));

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => notifications,
}));

const { useTasks } = await import('./useTasks');

const project = {
  id: 'project-1',
  tenantId: 'tenant-1',
  key: 'APP',
  name: 'App',
  description: null,
  status: 'ACTIVE' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const emptyPage = {
  success: true as const,
  data: [],
  meta: { page: 1, limit: 100, total: 0, totalPages: 0 },
};
const query = {
  page: 1,
  limit: 20,
  projectId: undefined,
  search: undefined,
  status: undefined,
  priority: undefined,
  assigneeId: undefined,
};

describe('useTasks CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listProjects.mockResolvedValue({
      success: true,
      data: [project],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    listByProject.mockResolvedValue(emptyPage);
  });

  it('loads tasks across the visible projects', async () => {
    const { result } = renderHook(() => useTasks(query));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(listProjects).toHaveBeenCalled();
    expect(result.current.tasks).toEqual([]);
    expect(result.current.projects).toEqual([project]);
  });

  it('creates a task and notifies on success', async () => {
    create.mockResolvedValueOnce({ id: 'task-1' });
    const { result } = renderHook(() => useTasks(query));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await act(() =>
      result.current.createTask('project-1', { title: 'Ship', priority: 'HIGH' }),
    );

    expect(ok).toBe(true);
    expect(create).toHaveBeenCalledWith('project-1', { title: 'Ship', priority: 'HIGH' });
    expect(notifications.success).toHaveBeenCalledWith('Task created');
  });

  it('updates a task and notifies on success', async () => {
    update.mockResolvedValueOnce({ id: 'task-1' });
    const { result } = renderHook(() => useTasks(query));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await act(() =>
      result.current.updateTask('task-1', { status: 'DONE', priority: 'HIGH' }),
    );

    expect(ok).toBe(true);
    expect(update).toHaveBeenCalledWith('task-1', { status: 'DONE', priority: 'HIGH' });
    expect(notifications.success).toHaveBeenCalledWith('Task updated');
  });

  it('archives a task and notifies on success', async () => {
    archive.mockResolvedValueOnce({ id: 'task-1' });
    const { result } = renderHook(() => useTasks(query));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await act(() => result.current.archiveTask('task-1'));

    expect(ok).toBe(true);
    expect(archive).toHaveBeenCalledWith('task-1');
    expect(notifications.success).toHaveBeenCalledWith('Task archived');
  });

  it('assigns a task and notifies on success', async () => {
    assign.mockResolvedValueOnce({ id: 'task-1' });
    const { result } = renderHook(() => useTasks(query));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await act(() => result.current.assignTask('task-1', 'user-1'));

    expect(ok).toBe(true);
    expect(assign).toHaveBeenCalledWith('task-1', 'user-1');
    expect(notifications.success).toHaveBeenCalledWith('Task assignment updated');
  });

  it('records a safe mutation error and notifies when create fails', async () => {
    create.mockRejectedValueOnce(new Error('unexpected'));
    const { result } = renderHook(() => useTasks(query));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await act(() =>
      result.current.createTask('project-1', { title: 'Ship', priority: 'HIGH' }),
    );

    expect(ok).toBe(false);
    expect(result.current.mutationError).toBe('Unable to update task');
    expect(notifications.error).toHaveBeenCalledWith('Task action failed', 'Unable to update task');
  });
});
