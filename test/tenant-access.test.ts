import { describe, expect, it, vi } from 'vitest';

import { AppError } from '../src/common/errors/app-error.js';
import {
  getTenantProject,
  getTenantProjectMember,
  getTenantTask,
  getTenantUser,
} from '../src/common/tenant/tenant-access.service.js';
import type { TenantContext } from '../src/common/tenant/tenant-context.js';

const tenantA: TenantContext = { tenantId: 'tenant-a', userId: 'user-a' };

const clientWithNoMatches = () =>
  ({
    user: { findFirst: vi.fn().mockResolvedValue(null) },
    project: { findFirst: vi.fn().mockResolvedValue(null) },
    task: { findFirst: vi.fn().mockResolvedValue(null) },
    projectMember: { findFirst: vi.fn().mockResolvedValue(null) },
  }) as never;

describe('tenant-scoped access', () => {
  it('rejects Tenant A access to a Tenant B user, project, and task', async () => {
    const client = clientWithNoMatches();

    await expect(getTenantUser(tenantA, 'tenant-b-user', client)).rejects.toMatchObject<AppError>({
      statusCode: 404,
    });
    await expect(
      getTenantProject(tenantA, 'tenant-b-project', client),
    ).rejects.toMatchObject<AppError>({
      statusCode: 404,
    });
    await expect(getTenantTask(tenantA, 'tenant-b-task', client)).rejects.toMatchObject<AppError>({
      statusCode: 404,
    });

    expect(client.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'tenant-b-user', tenantId: 'tenant-a' } }),
    );
    expect(client.project.findFirst).toHaveBeenCalledWith({
      where: { id: 'tenant-b-project', tenantId: 'tenant-a' },
    });
    expect(client.task.findFirst).toHaveBeenCalledWith({
      where: { id: 'tenant-b-task', tenantId: 'tenant-a' },
    });
  });

  it('rejects a project membership from another tenant even when its IDs are supplied', async () => {
    const client = clientWithNoMatches();

    await expect(
      getTenantProjectMember(tenantA, 'tenant-b-project', 'tenant-b-user', client),
    ).rejects.toMatchObject<AppError>({
      statusCode: 404,
    });

    expect(client.projectMember.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        projectId: 'tenant-b-project',
        userId: 'tenant-b-user',
        project: { tenantId: 'tenant-a' },
        user: { tenantId: 'tenant-a' },
      },
    });
  });
});
