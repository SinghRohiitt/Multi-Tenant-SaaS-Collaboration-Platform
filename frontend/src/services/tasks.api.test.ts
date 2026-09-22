import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post, patch, remove } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('./api', () => ({ api: { get, post, patch, delete: remove } }));

const { tasksApi } = await import('./tasks.api');

describe('tasksApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists project tasks with supported filters', async () => {
    const response = {
      success: true as const,
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
    get.mockResolvedValueOnce({ data: response });
    await expect(
      tasksApi.listByProject('project-1', { page: 1, limit: 20, status: 'DONE', priority: 'HIGH' }),
    ).resolves.toEqual(response);
    expect(get).toHaveBeenCalledWith('/projects/project-1/tasks', {
      params: { page: 1, limit: 20, status: 'DONE', priority: 'HIGH' },
    });
  });

  it('updates assignment through the dedicated endpoint', async () => {
    patch.mockResolvedValueOnce({ data: { success: true, data: {} } });
    await tasksApi.assign('task-1', 'user-1');
    expect(patch).toHaveBeenCalledWith('/tasks/task-1/assignee', { assigneeId: 'user-1' });
  });

  it('supports task create, update, and archive operations', async () => {
    post.mockResolvedValueOnce({ data: { success: true, data: { id: 'task-1' } } });
    patch.mockResolvedValueOnce({ data: { success: true, data: { id: 'task-1' } } });
    remove.mockResolvedValueOnce({ data: { success: true, data: { id: 'task-1' } } });

    await tasksApi.create('project-1', { title: 'Ship feature', priority: 'HIGH' });
    await tasksApi.update('task-1', { status: 'DONE', priority: 'HIGH' });
    await tasksApi.archive('task-1');

    expect(post).toHaveBeenCalledWith('/projects/project-1/tasks', {
      title: 'Ship feature',
      priority: 'HIGH',
    });
    expect(patch).toHaveBeenCalledWith('/tasks/task-1', { status: 'DONE', priority: 'HIGH' });
    expect(remove).toHaveBeenCalledWith('/tasks/task-1');
  });
});
