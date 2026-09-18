import type { Prisma, PrismaClient } from '@prisma/client';

import { AppError } from '../errors/app-error.js';
import { prisma } from '../../database/prisma.js';
import type { TenantContext } from './tenant-context.js';

type TenantAccessClient = Pick<PrismaClient, 'user' | 'project' | 'projectMember' | 'task'>;

const safeUserSelect = {
  id: true,
  tenantId: true,
  email: true,
  displayName: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const requireResource = <T>(resource: T | null, resourceName: string): T => {
  if (!resource) throw new AppError(404, `${resourceName} not found`);
  return resource;
};

/**
 * Tenant-bound lookup helpers. Use these before reading, modifying, or deleting
 * an existing tenant resource. They deliberately return 404 for another tenant's
 * record so callers cannot discover that record exists.
 */
export const getTenantUser = async (
  context: TenantContext,
  userId: string,
  client: TenantAccessClient = prisma,
) =>
  requireResource(
    await client.user.findFirst({
      where: { id: userId, tenantId: context.tenantId },
      select: safeUserSelect,
    }),
    'User',
  );

export const getTenantProject = async (
  context: TenantContext,
  projectId: string,
  client: TenantAccessClient = prisma,
) =>
  requireResource(
    await client.project.findFirst({ where: { id: projectId, tenantId: context.tenantId } }),
    'Project',
  );

export const getTenantTask = async (
  context: TenantContext,
  taskId: string,
  client: TenantAccessClient = prisma,
) =>
  requireResource(
    await client.task.findFirst({ where: { id: taskId, tenantId: context.tenantId } }),
    'Task',
  );

export const getTenantProjectMember = async (
  context: TenantContext,
  projectId: string,
  userId: string,
  client: TenantAccessClient = prisma,
) =>
  requireResource(
    await client.projectMember.findFirst({
      where: {
        projectId,
        userId,
        project: { tenantId: context.tenantId },
        user: { tenantId: context.tenantId },
      },
    }),
    'Project member',
  );
