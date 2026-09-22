import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { list, create, update, archive } = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  archive: vi.fn(),
}));

const notifications = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));

vi.mock('@/services/projects.api', () => ({
  projectsApi: { list, create, update, archive },
}));

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => notifications,
}));

const { useProjects } = await import('./useProjects');

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

const emptyMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };
const query = { page: 1, limit: 20, search: undefined, status: undefined };

describe('useProjects CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    list.mockResolvedValue({ success: true, data: [], meta: emptyMeta });
  });

  it('loads projects from the API', async () => {
    list.mockResolvedValueOnce({
      success: true,
      data: [project],
      meta: { ...emptyMeta, total: 1 },
    });
    const { result } = renderHook(() => useProjects(query));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(list).toHaveBeenCalledWith(query);
    expect(result.current.data).toEqual([project]);
  });

  it('creates a project and reloads the list on success', async () => {
    create.mockResolvedValueOnce({ id: 'project-2' });
    const { result } = renderHook(() => useProjects(query));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await act(() => result.current.createProject({ key: 'WEB', name: 'Web app' }));

    expect(ok).toBe(true);
    expect(create).toHaveBeenCalledWith({ key: 'WEB', name: 'Web app' });
    expect(notifications.success).toHaveBeenCalledWith('Project created');
    expect(list).toHaveBeenCalledTimes(2);
    expect(result.current.mutationError).toBeNull();
  });

  it('updates a project and reloads on success', async () => {
    update.mockResolvedValueOnce({ id: 'project-1' });
    const { result } = renderHook(() => useProjects(query));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await act(() =>
      result.current.updateProject('project-1', { name: 'Renamed', status: 'ON_HOLD' }),
    );

    expect(ok).toBe(true);
    expect(update).toHaveBeenCalledWith('project-1', { name: 'Renamed', status: 'ON_HOLD' });
    expect(notifications.success).toHaveBeenCalledWith('Project updated');
  });

  it('archives a project and reloads on success', async () => {
    archive.mockResolvedValueOnce({ id: 'project-1' });
    const { result } = renderHook(() => useProjects(query));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await act(() => result.current.archiveProject('project-1'));

    expect(ok).toBe(true);
    expect(archive).toHaveBeenCalledWith('project-1');
    expect(notifications.success).toHaveBeenCalledWith('Project archived');
  });

  it('records a safe mutation error and notifies when create fails', async () => {
    create.mockRejectedValueOnce(new Error('unexpected'));
    const { result } = renderHook(() => useProjects(query));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await act(() => result.current.createProject({ key: 'WEB', name: 'Web app' }));

    expect(ok).toBe(false);
    expect(result.current.mutationError).toBe('Unable to update project');
    expect(notifications.error).toHaveBeenCalledWith(
      'Project action failed',
      'Unable to update project',
    );
    expect(list).toHaveBeenCalledTimes(1);
  });
});
