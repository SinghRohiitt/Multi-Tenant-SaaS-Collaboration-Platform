import { Prisma } from '@prisma/client';

import type { AuthorizationContext } from '../../common/authorization/authorization.middleware.js';
import { Permission, RoleName } from '../../common/authorization/rbac.js';
import { AppError } from '../../common/errors/app-error.js';
import type { TenantContext } from '../../common/tenant/tenant-context.js';
import { cache, cacheKeys } from '../../cache/redis-cache.js';
import { prisma } from '../../database/prisma.js';
import type { AddProjectMemberInput, ListProjectMembersInput } from './member.schemas.js';

const memberSelect = {
  projectId: true,
  userId: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, email: true, displayName: true, status: true } },
} satisfies Prisma.ProjectMemberSelect;

export type ProjectMemberResponse = Prisma.ProjectMemberGetPayload<{ select: typeof memberSelect }>;
export type ProjectMemberListResponse = {
  data: ProjectMemberResponse[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type ProjectMemberRepository = {
  projectExists: (tenantId: string, projectId: string) => Promise<boolean>;
  userExists: (tenantId: string, userId: string) => Promise<boolean>;
  isMember: (tenantId: string, projectId: string, userId: string) => Promise<boolean>;
  create: (tenantId: string, projectId: string, userId: string) => Promise<ProjectMemberResponse>;
  remove: (tenantId: string, projectId: string, userId: string) => Promise<void>;
  find: (
    tenantId: string,
    projectId: string,
    userId: string,
  ) => Promise<ProjectMemberResponse | null>;
  list: (
    tenantId: string,
    projectId: string,
    skip: number,
    take: number,
  ) => Promise<ProjectMemberResponse[]>;
  count: (tenantId: string, projectId: string) => Promise<number>;
};

const repository: ProjectMemberRepository = {
  projectExists: async (tenantId, projectId) =>
    Boolean(
      await prisma.project.findFirst({ where: { id: projectId, tenantId }, select: { id: true } }),
    ),
  userExists: async (tenantId, userId) =>
    Boolean(await prisma.user.findFirst({ where: { id: userId, tenantId }, select: { id: true } })),
  isMember: async (tenantId, projectId, userId) =>
    Boolean(
      await prisma.projectMember.findFirst({
        where: { tenantId, projectId, userId },
        select: { projectId: true },
      }),
    ),
  create: (tenantId, projectId, userId) =>
    prisma.projectMember.create({ data: { tenantId, projectId, userId }, select: memberSelect }),
  remove: async (tenantId, projectId, userId) => {
    await prisma.projectMember.deleteMany({ where: { tenantId, projectId, userId } });
  },
  find: (tenantId, projectId, userId) =>
    prisma.projectMember.findFirst({
      where: { tenantId, projectId, userId },
      select: memberSelect,
    }),
  list: (tenantId, projectId, skip, take) =>
    prisma.projectMember.findMany({
      where: { tenantId, projectId },
      skip,
      take,
      orderBy: { createdAt: 'asc' },
      select: memberSelect,
    }),
  count: (tenantId, projectId) => prisma.projectMember.count({ where: { tenantId, projectId } }),
};

const isAdmin = (authorization: AuthorizationContext): boolean =>
  authorization.roles.includes(RoleName.ADMIN);
const canManage = (authorization: AuthorizationContext): boolean =>
  authorization.permissions.includes(Permission.PROJECT_MEMBERS_MANAGE);
const canView = (authorization: AuthorizationContext): boolean =>
  authorization.permissions.includes(Permission.PROJECT_VIEW_ASSIGNED);

const requireProject = async (
  context: TenantContext,
  projectId: string,
  db: ProjectMemberRepository,
) => {
  if (!(await db.projectExists(context.tenantId, projectId)))
    throw new AppError(404, 'Project not found');
};

const requireAccess = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  db: ProjectMemberRepository,
  managing: boolean,
) => {
  if (isAdmin(authorization)) return;
  if (managing ? !canManage(authorization) : !canView(authorization)) {
    throw new AppError(
      403,
      managing ? 'You cannot manage project members' : 'You cannot view project members',
    );
  }
  if (!(await db.isMember(context.tenantId, projectId, context.userId))) {
    throw new AppError(403, 'You are not authorized for this project');
  }
};

export const addMember = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  input: AddProjectMemberInput,
  db: ProjectMemberRepository = repository,
): Promise<ProjectMemberResponse> => {
  await requireProject(context, projectId, db);
  await requireAccess(context, authorization, projectId, db, true);
  if (!(await db.userExists(context.tenantId, input.userId)))
    throw new AppError(404, 'User not found');
  if (await db.isMember(context.tenantId, projectId, input.userId)) {
    throw new AppError(409, 'User is already a project member');
  }
  try {
    const created = await db.create(context.tenantId, projectId, input.userId);
    await cache.invalidateTenant(context.tenantId, 'members');
    await cache.invalidateTenant(context.tenantId, 'projects');
    await cache.invalidateTenant(context.tenantId, 'tasks');
    return created;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'User is already a project member');
    }
    throw error;
  }
};

export const removeMember = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  userId: string,
  db: ProjectMemberRepository = repository,
): Promise<void> => {
  await requireProject(context, projectId, db);
  await requireAccess(context, authorization, projectId, db, true);
  if (!(await db.isMember(context.tenantId, projectId, userId)))
    throw new AppError(404, 'Project member not found');
  await db.remove(context.tenantId, projectId, userId);
  await cache.invalidateTenant(context.tenantId, 'members');
  await cache.invalidateTenant(context.tenantId, 'projects');
  await cache.invalidateTenant(context.tenantId, 'tasks');
};

export const listMembers = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  input: ListProjectMembersInput,
  db: ProjectMemberRepository = repository,
): Promise<ProjectMemberListResponse> => {
  await requireProject(context, projectId, db);
  await requireAccess(context, authorization, projectId, db, false);
  const skip = (input.page - 1) * input.limit;
  const cacheKey = cacheKeys.members(context.tenantId, context.userId, projectId, input);
  const cached = await cache.get<ProjectMemberListResponse>(cacheKey);
  if (cached) return cached;
  const [data, total] = await Promise.all([
    db.list(context.tenantId, projectId, skip, input.limit),
    db.count(context.tenantId, projectId),
  ]);
  const result = {
    data,
    meta: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
  await cache.set(cacheKey, result);
  return result;
};

export const getMember = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  userId: string,
  db: ProjectMemberRepository = repository,
): Promise<ProjectMemberResponse> => {
  await requireProject(context, projectId, db);
  await requireAccess(context, authorization, projectId, db, false);
  const cacheKey = cacheKeys.member(context.tenantId, context.userId, projectId, userId);
  const cached = await cache.get<ProjectMemberResponse>(cacheKey);
  if (cached) return cached;
  const member = await db.find(context.tenantId, projectId, userId);
  if (!member) throw new AppError(404, 'Project member not found');
  await cache.set(cacheKey, member);
  return member;
};
