import { describe, expect, it, vi } from 'vitest';

import {
  assertCanManageAssignedProject,
  assertCanUpdateTask,
  assertCanViewAssignedProject,
} from '../src/common/authorization/authorization.policy.js';
import type { AuthorizationContext } from '../src/common/authorization/authorization.middleware.js';
import type { TenantContext } from '../src/common/tenant/tenant-context.js';
import { Permission, RoleName, rolePermissions } from '../src/common/authorization/rbac.js';

const tenantA: TenantContext = { tenantId: 'tenant-a', userId: 'user-a' };
const admin: AuthorizationContext = { roles: [RoleName.ADMIN], permissions: rolePermissions.ADMIN };
const manager: AuthorizationContext = {
  roles: [RoleName.MANAGER],
  permissions: rolePermissions.MANAGER,
};
const member: AuthorizationContext = {
  roles: [RoleName.MEMBER],
  permissions: rolePermissions.MEMBER,
};

const client = (membership: unknown = null, task: unknown = null) =>
  ({
    projectMember: { findFirst: vi.fn().mockResolvedValue(membership) },
    task: { findFirst: vi.fn().mockResolvedValue(task) },
  }) as never;

describe('RBAC role definitions', () => {
  it('maps the intended capability levels', () => {
    expect(rolePermissions.ADMIN).toContain(Permission.TENANT_USERS_MANAGE);
    expect(rolePermissions.MANAGER).toContain(Permission.PROJECT_MANAGE_ASSIGNED);
    expect(rolePermissions.MEMBER).toContain(Permission.TASK_UPDATE_ASSIGNED);
    expect(rolePermissions.MEMBER).not.toContain(Permission.TASK_UPDATE);
  });
});

describe('tenant-aware authorization policies', () => {
  it('allows an admin to manage a project without membership lookup', async () => {
    const db = client();

    await expect(
      assertCanManageAssignedProject(tenantA, admin, 'tenant-b-project', db),
    ).resolves.toBeUndefined();
    expect(db.projectMember.findFirst).not.toHaveBeenCalled();
  });

  it('allows a manager only when they belong to that tenant-scoped project', async () => {
    const db = client({ projectId: 'project-a' });

    await expect(
      assertCanManageAssignedProject(tenantA, manager, 'project-a', db),
    ).resolves.toBeUndefined();
    expect(db.projectMember.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        projectId: 'project-a',
        userId: 'user-a',
        project: { tenantId: 'tenant-a' },
      },
    });
  });

  it('rejects a member attempting to view a cross-tenant project by changing its ID', async () => {
    const db = client(null);

    await expect(
      assertCanViewAssignedProject(tenantA, member, 'tenant-b-project', db),
    ).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(db.projectMember.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        projectId: 'tenant-b-project',
        userId: 'user-a',
        project: { tenantId: 'tenant-a' },
      },
    });
  });

  it('allows a member to update only a task assigned to them in their tenant', async () => {
    const allowed = client(null, { id: 'task-a' });
    const denied = client(null, null);

    await expect(assertCanUpdateTask(tenantA, member, 'task-a', allowed)).resolves.toBeUndefined();
    await expect(
      assertCanUpdateTask(tenantA, member, 'tenant-b-task', denied),
    ).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(allowed.task.findFirst).toHaveBeenCalledWith({
      where: { id: 'task-a', tenantId: 'tenant-a', assigneeId: 'user-a' },
    });
  });

  it('rejects a manager updating a task in a project they are not assigned to', async () => {
    const db = client(null, null);

    await expect(assertCanUpdateTask(tenantA, manager, 'tenant-b-task', db)).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(db.task.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'tenant-b-task',
        tenantId: 'tenant-a',
        project: { members: { some: { userId: 'user-a' } } },
      },
    });
  });

  it('rejects a member without project-management permission', async () => {
    const db = client({ projectId: 'project-a' });

    await expect(
      assertCanManageAssignedProject(tenantA, member, 'project-a', db),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(db.projectMember.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a member without task-update permission', async () => {
    const db = client(null, { id: 'task-a' });
    const viewer: AuthorizationContext = { roles: [], permissions: [] };

    await expect(assertCanUpdateTask(tenantA, viewer, 'task-a', db)).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(db.task.findFirst).not.toHaveBeenCalled();
  });
});
