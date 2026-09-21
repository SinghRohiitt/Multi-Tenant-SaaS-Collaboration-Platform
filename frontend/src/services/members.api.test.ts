import { describe, expect, it, vi } from 'vitest';

const { get, post, remove } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('./api', () => ({ api: { get, post, delete: remove } }));

const { membersApi } = await import('./members.api');

describe('membersApi', () => {
  it('lists members for a project using backend pagination', async () => {
    const response = {
      success: true as const,
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
    get.mockResolvedValueOnce({ data: response });

    await expect(membersApi.listByProject('project-1', { page: 1, limit: 20 })).resolves.toEqual(
      response,
    );
    expect(get).toHaveBeenCalledWith('/projects/project-1/members', {
      params: { page: 1, limit: 20 },
    });
  });

  it('uses the project member add and remove endpoints', async () => {
    post.mockResolvedValueOnce({ data: { success: true, data: {} } });
    remove.mockResolvedValueOnce({ status: 204 });

    await membersApi.add('project-1', { userId: 'user-1' });
    await membersApi.remove('project-1', 'user-1');

    expect(post).toHaveBeenCalledWith('/projects/project-1/members', { userId: 'user-1' });
    expect(remove).toHaveBeenCalledWith('/projects/project-1/members/user-1');
  });
});
