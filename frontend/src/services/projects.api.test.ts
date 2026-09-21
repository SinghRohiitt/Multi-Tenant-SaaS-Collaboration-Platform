import { describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('./api', () => ({ api: { get } }));

const { projectsApi } = await import('./projects.api');

describe('projectsApi', () => {
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
});
