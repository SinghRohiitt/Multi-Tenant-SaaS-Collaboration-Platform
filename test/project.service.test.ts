import { Prisma, ProjectStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { Permission, RoleName, rolePermissions } from '../src/common/authorization/rbac.js';
import type { AuthorizationContext } from '../src/common/authorization/authorization.middleware.js';
import type { TenantContext } from '../src/common/tenant/tenant-context.js';
import {
  createProjectSchema,
  listProjectsSchema,
} from '../src/modules/projects/project.schemas.js';
import {
  archiveProject,
  createProject,
  getProject,
  listProjects,
  updateProject,
  type ProjectRepository,
  type ProjectResponse,
} from '../src/modules/projects/project.service.js';

const tenantA: TenantContext = { tenantId: 'tenant-a', userId: 'user-a' };
const admin: AuthorizationContext = { roles: [RoleName.ADMIN], permissions: rolePermissions.ADMIN };
const manager: AuthorizationContext = {
  roles: [RoleName.MANAGER],
  permissions: rolePermissions.MANAGER,
};

const project = (changes: Partial<ProjectResponse> = {}): ProjectResponse => ({
  id: 'project-a',
  tenantId: 'tenant-a',
  key: 'ALPHA',
  name: 'Alpha',
  description: null,
  status: ProjectStatus.PLANNING,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...changes,
});

const repository = (overrides: Partial<ProjectRepository> = {}): ProjectRepository => ({
  createWithMember: vi.fn().mockResolvedValue(project()),
  findByTenant: vi.fn().mockResolvedValue(project()),
  hasMembership: vi.fn().mockResolvedValue(true),
  update: vi.fn().mockImplementation(async (_id, input) => project(input)),
  list: vi.fn().mockResolvedValue([project()]),
  count: vi.fn().mockResolvedValue(1),
  ...overrides,
});

describe('project service', () => {
  it('creates a tenant-scoped project and adds the creator as a member', async () => {
    const db = repository();

    const result = await createProject(tenantA, { key: 'ALPHA', name: 'Alpha' }, db);

    expect(result.tenantId).toBe('tenant-a');
    expect(db.createWithMember).toHaveBeenCalledWith(
      'tenant-a',
      {
        key: 'ALPHA',
        name: 'Alpha',
      },
      'user-a',
    );
  });

  it('reads, updates, and archives an admin project without exposing other tenants', async () => {
    const db = repository();

    await expect(getProject(tenantA, admin, 'project-a', db)).resolves.toMatchObject({
      id: 'project-a',
    });
    await expect(
      updateProject(tenantA, admin, 'project-a', { name: 'Renamed' }, db),
    ).resolves.toMatchObject({
      name: 'Renamed',
    });
    await expect(archiveProject(tenantA, admin, 'project-a', db)).resolves.toMatchObject({
      status: ProjectStatus.ARCHIVED,
    });
    expect(db.findByTenant).toHaveBeenCalledWith('tenant-a', 'project-a');
  });

  it('rejects manager access when the manager is not a project member', async () => {
    const db = repository({ hasMembership: vi.fn().mockResolvedValue(false) });

    await expect(
      updateProject(tenantA, manager, 'project-a', { name: 'Renamed' }, db),
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('rejects a cross-tenant project ID before authorizing access', async () => {
    const db = repository({ findByTenant: vi.fn().mockResolvedValue(null) });

    await expect(getProject(tenantA, admin, 'tenant-b-project', db)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(db.findByTenant).toHaveBeenCalledWith('tenant-a', 'tenant-b-project');
  });

  it('returns not found when updating a nonexistent project', async () => {
    const db = repository({ findByTenant: vi.fn().mockResolvedValue(null) });

    await expect(
      updateProject(tenantA, admin, 'missing-project', { name: 'Renamed' }, db),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(db.update).not.toHaveBeenCalled();
  });

  it('maps duplicate project keys to a conflict', async () => {
    const duplicate = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const db = repository({ createWithMember: vi.fn().mockRejectedValue(duplicate) });

    await expect(createProject(tenantA, { key: 'ALPHA', name: 'Alpha' }, db)).rejects.toMatchObject(
      {
        statusCode: 409,
      },
    );
    expect(db.createWithMember).toHaveBeenCalledTimes(1);
  });

  it('applies pagination, status, search, and membership filtering to project lists', async () => {
    const db = repository({ count: vi.fn().mockResolvedValue(23) });
    const input = { page: 2, limit: 10, status: ProjectStatus.ACTIVE, search: 'alpha' };

    const result = await listProjects(tenantA, manager, input, db);

    expect(result.meta).toEqual({ page: 2, limit: 10, total: 23, totalPages: 3 });
    expect(db.list).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-a',
        status: ProjectStatus.ACTIVE,
        OR: [
          { name: { contains: 'alpha', mode: 'insensitive' } },
          { key: { contains: 'alpha', mode: 'insensitive' } },
        ],
        members: { some: { userId: 'user-a' } },
      },
      10,
      10,
    );
  });
});

describe('project DTO validation', () => {
  it('rejects invalid project keys and invalid pagination', () => {
    expect(
      createProjectSchema.safeParse({ body: { key: 'not valid', name: '' }, params: {}, query: {} })
        .success,
    ).toBe(false);
    expect(
      listProjectsSchema.safeParse({ body: {}, params: {}, query: { page: 0, limit: 101 } })
        .success,
    ).toBe(false);
  });

  it('normalizes valid project keys', () => {
    const result = createProjectSchema.parse({
      body: { key: 'alpha', name: 'Alpha' },
      params: {},
      query: {},
    });
    expect(result.body.key).toBe('ALPHA');
    expect(rolePermissions.MANAGER).toContain(Permission.PROJECT_MANAGE_ASSIGNED);
  });
});
