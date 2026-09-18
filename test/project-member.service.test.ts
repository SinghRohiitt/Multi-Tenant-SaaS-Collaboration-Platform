import { describe, expect, it, vi } from 'vitest';

import type { AuthorizationContext } from '../src/common/authorization/authorization.middleware.js';
import { Permission, RoleName, rolePermissions } from '../src/common/authorization/rbac.js';
import type { TenantContext } from '../src/common/tenant/tenant-context.js';
import {
  addMember,
  getMember,
  listMembers,
  removeMember,
  type ProjectMemberRepository,
  type ProjectMemberResponse,
} from '../src/modules/project-members/member.service.js';

const tenantA: TenantContext = { tenantId: 'tenant-a', userId: 'admin-a' };
const admin: AuthorizationContext = { roles: [RoleName.ADMIN], permissions: rolePermissions.ADMIN };
const manager: AuthorizationContext = {
  roles: [RoleName.MANAGER],
  permissions: rolePermissions.MANAGER,
};

const member = (overrides: Partial<ProjectMemberResponse> = {}): ProjectMemberResponse => ({
  projectId: 'project-a',
  userId: 'user-b',
  tenantId: 'tenant-a',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  user: { id: 'user-b', email: 'user@example.com', displayName: 'User', status: 'ACTIVE' },
  ...overrides,
});

const repository = (overrides: Partial<ProjectMemberRepository> = {}): ProjectMemberRepository => ({
  projectExists: vi.fn().mockResolvedValue(true),
  userExists: vi.fn().mockResolvedValue(true),
  isMember: vi.fn().mockResolvedValue(false),
  create: vi.fn().mockResolvedValue(member()),
  remove: vi.fn().mockResolvedValue(undefined),
  find: vi.fn().mockResolvedValue(member()),
  list: vi.fn().mockResolvedValue([member()]),
  count: vi.fn().mockResolvedValue(1),
  ...overrides,
});

describe('project member service', () => {
  it('assigns a same-tenant user and includes tenantId in the write', async () => {
    const db = repository();

    await expect(
      addMember(tenantA, admin, 'project-a', { userId: 'user-b' }, db),
    ).resolves.toMatchObject({
      projectId: 'project-a',
    });
    expect(db.create).toHaveBeenCalledWith('tenant-a', 'project-a', 'user-b');
  });

  it('rejects duplicate assignments', async () => {
    const db = repository({ isMember: vi.fn().mockResolvedValue(true) });

    await expect(
      addMember(tenantA, admin, 'project-a', { userId: 'user-b' }, db),
    ).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(db.create).not.toHaveBeenCalled();
  });

  it('removes a membership and lists/details members with pagination', async () => {
    const db = repository({
      count: vi.fn().mockResolvedValue(21),
      isMember: vi.fn().mockResolvedValue(true),
    });

    await expect(removeMember(tenantA, admin, 'project-a', 'user-b', db)).resolves.toBeUndefined();
    const result = await listMembers(tenantA, admin, 'project-a', { page: 2, limit: 10 }, db);
    await expect(getMember(tenantA, admin, 'project-a', 'user-b', db)).resolves.toMatchObject({
      userId: 'user-b',
    });
    expect(db.remove).toHaveBeenCalledWith('tenant-a', 'project-a', 'user-b');
    expect(result.meta).toEqual({ page: 2, limit: 10, total: 21, totalPages: 3 });
    expect(db.list).toHaveBeenCalledWith('tenant-a', 'project-a', 10, 10);
  });

  it('rejects cross-tenant project and user assignments', async () => {
    const missingProject = repository({ projectExists: vi.fn().mockResolvedValue(false) });
    const missingUser = repository({ userExists: vi.fn().mockResolvedValue(false) });

    await expect(
      addMember(tenantA, admin, 'tenant-b-project', { userId: 'user-b' }, missingProject),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(
      addMember(tenantA, admin, 'project-a', { userId: 'tenant-b-user' }, missingUser),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('returns not found for a nonexistent project member', async () => {
    const db = repository({ find: vi.fn().mockResolvedValue(null) });

    await expect(getMember(tenantA, admin, 'project-a', 'missing-user', db)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(db.find).toHaveBeenCalledWith('tenant-a', 'project-a', 'missing-user');
  });

  it('rejects a manager who is not a member of the project', async () => {
    const db = repository({ isMember: vi.fn().mockResolvedValue(false) });

    await expect(
      addMember(tenantA, manager, 'project-a', { userId: 'user-b' }, db),
    ).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(db.create).not.toHaveBeenCalled();
  });
});
