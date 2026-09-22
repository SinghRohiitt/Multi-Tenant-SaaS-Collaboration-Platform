import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post, patch, remove } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('./api', () => ({ api: { get, post, patch, delete: remove } }));

const { projectsApi } = await import('./projects.api');

describe('projectsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests paginated projects with search and status filters', async () => {
    const response = {
      success: true as const,
      data: [],
      meta: { page: 2, limit: 20, total: 0, totalPages: 0 },
    };
    get.mockResolvedValueOnce({ data: response });

    await expect(
      projectsApi.list({ page: 2, limit: 20, search: 'platform', status: 'ACTIVE' }),
    ).resolves.toEqual(response);
    expect(get).toHaveBeenCalledWith('/projects', {
      params: { page: 2, limit: 20, search: 'platform', status: 'ACTIVE' },
    });
  });

  it('supports project create, update, and archive operations', async () => {
    post.mockResolvedValueOnce({ data: { success: true, data: { id: 'project-1' } } });
    patch.mockResolvedValueOnce({ data: { success: true, data: { id: 'project-1' } } });
    remove.mockResolvedValueOnce({ data: { success: true, data: { id: 'project-1' } } });

    await projectsApi.create({ key: 'APP', name: 'App' });
    await projectsApi.update('project-1', { name: 'Updated App', status: 'ACTIVE' });
    await projectsApi.archive('project-1');

    expect(post).toHaveBeenCalledWith('/projects', { key: 'APP', name: 'App' });
    expect(patch).toHaveBeenCalledWith('/projects/project-1', {
      name: 'Updated App',
      status: 'ACTIVE',
    });
    expect(remove).toHaveBeenCalledWith('/projects/project-1');
  });
});
