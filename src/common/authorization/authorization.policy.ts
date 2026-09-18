import type { PrismaClient } from '@prisma/client';

import { AppError } from '../errors/app-error.js';
import type { TenantContext } from '../tenant/tenant-context.js';
import { prisma } from '../../database/prisma.js';
import type { AuthorizationContext } from './authorization.middleware.js';
import { Permission, RoleName } from './rbac.js';

type PolicyClient = Pick<PrismaClient, 'projectMember' | 'task'>;

const has = (authorization: AuthorizationContext, permission: Permission): boolean =>
  authorization.permissions.includes(permission);
const isAdmin = (authorization: AuthorizationContext): boolean =>
  authorization.roles.includes(RoleName.ADMIN);

const requireProjectMembership = async (
  context: TenantContext,
  projectId: string,
  client: PolicyClient,
): Promise<void> => {
  const membership = await client.projectMember.findFirst({
    where: { projectId, userId: context.userId, project: { tenantId: context.tenantId } },
  });
  if (!membership) throw new AppError(403, 'You are not authorized for this project');
};

export const assertCanViewAssignedProject = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  client: PolicyClient = prisma,
): Promise<void> => {
  if (isAdmin(authorization)) return;
  if (!has(authorization, Permission.PROJECT_VIEW_ASSIGNED))
    throw new AppError(403, 'You cannot view projects');
  await requireProjectMembership(context, projectId, client);
};

export const assertCanManageAssignedProject = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  client: PolicyClient = prisma,
): Promise<void> => {
  if (isAdmin(authorization)) return;
  if (!has(authorization, Permission.PROJECT_MANAGE_ASSIGNED))
    throw new AppError(403, 'You cannot manage this project');
  await requireProjectMembership(context, projectId, client);
};

export const assertCanManageProjectMembers = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  client: PolicyClient = prisma,
): Promise<void> => {
  if (isAdmin(authorization)) return;
  if (!has(authorization, Permission.PROJECT_MEMBERS_MANAGE)) {
    throw new AppError(403, 'You cannot manage project members');
  }
  await requireProjectMembership(context, projectId, client);
};

export const assertCanCreateTask = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  client: PolicyClient = prisma,
): Promise<void> => {
  if (isAdmin(authorization)) return;
  if (!has(authorization, Permission.TASK_CREATE))
    throw new AppError(403, 'You cannot create tasks');
  await requireProjectMembership(context, projectId, client);
};

export const assertCanUpdateTask = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  taskId: string,
  client: PolicyClient = prisma,
): Promise<void> => {
  if (isAdmin(authorization)) return;
  if (has(authorization, Permission.TASK_UPDATE)) {
    const task = await client.task.findFirst({
      where: {
        id: taskId,
        tenantId: context.tenantId,
        project: { members: { some: { userId: context.userId } } },
      },
    });
    if (!task) throw new AppError(403, 'You cannot update this task');
    return;
  }
  if (!has(authorization, Permission.TASK_UPDATE_ASSIGNED))
    throw new AppError(403, 'You cannot update this task');
  const task = await client.task.findFirst({
    where: { id: taskId, tenantId: context.tenantId, assigneeId: context.userId },
  });
  if (!task) throw new AppError(403, 'You cannot update this task');
};
