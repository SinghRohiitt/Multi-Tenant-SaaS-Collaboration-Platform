import { Prisma, ProjectStatus } from '@prisma/client';

import type { AuthorizationContext } from '../../common/authorization/authorization.middleware.js';
import { Permission, RoleName } from '../../common/authorization/rbac.js';
import { AppError } from '../../common/errors/app-error.js';
import type { TenantContext } from '../../common/tenant/tenant-context.js';
import { cache, cacheKeys } from '../../cache/redis-cache.js';
import { prisma } from '../../database/prisma.js';
import { createDomainEvent, publishDomainEvent } from '../../events/index.js';
import type {
  CreateProjectInput,
  ListProjectsInput,
  UpdateProjectInput,
} from './project.schemas.js';

const projectSelect = {
  id: true,
  tenantId: true,
  key: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

export type ProjectResponse = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;
export type ProjectListResponse = {
  data: ProjectResponse[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type ProjectRepository = {
  createWithMember: (
    tenantId: string,
    input: CreateProjectInput,
    userId: string,
  ) => Promise<ProjectResponse>;
  findByTenant: (tenantId: string, projectId: string) => Promise<ProjectResponse | null>;
  hasMembership: (tenantId: string, projectId: string, userId: string) => Promise<boolean>;
  update: (projectId: string, input: UpdateProjectInput) => Promise<ProjectResponse>;
  list: (where: Prisma.ProjectWhereInput, skip: number, take: number) => Promise<ProjectResponse[]>;
  count: (where: Prisma.ProjectWhereInput) => Promise<number>;
};

const prismaRepository: ProjectRepository = {
  createWithMember: (tenantId, input, userId) =>
    prisma.$transaction(async (transaction) => {
      const project = await transaction.project.create({
        data: { tenantId, key: input.key, name: input.name, description: input.description },
        select: projectSelect,
      });
      await transaction.projectMember.create({ data: { tenantId, projectId: project.id, userId } });
      return project;
    }),
  findByTenant: (tenantId, projectId) =>
    prisma.project.findFirst({ where: { id: projectId, tenantId }, select: projectSelect }),
  hasMembership: async (tenantId, projectId, userId) =>
    Boolean(
      await prisma.projectMember.findFirst({
        where: { projectId, userId, project: { tenantId } },
        select: { projectId: true },
      }),
    ),
  update: (projectId, input) =>
    prisma.project.update({ where: { id: projectId }, data: input, select: projectSelect }),
  list: (where, skip, take) =>
    prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: projectSelect,
    }),
  count: (where) => prisma.project.count({ where }),
};

const isAdmin = (authorization: AuthorizationContext): boolean =>
  authorization.roles.includes(RoleName.ADMIN);
const has = (authorization: AuthorizationContext, permission: Permission): boolean =>
  authorization.permissions.includes(permission);

const requireProject = async (
  context: TenantContext,
  projectId: string,
  repository: ProjectRepository,
): Promise<ProjectResponse> => {
  const project = await repository.findByTenant(context.tenantId, projectId);
  if (!project) throw new AppError(404, 'Project not found');
  return project;
};

const requireMembership = async (
  context: TenantContext,
  projectId: string,
  repository: ProjectRepository,
): Promise<void> => {
  if (!(await repository.hasMembership(context.tenantId, projectId, context.userId))) {
    throw new AppError(403, 'You are not authorized for this project');
  }
};

const requireViewAccess = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  repository: ProjectRepository,
): Promise<void> => {
  if (isAdmin(authorization)) return;
  if (!has(authorization, Permission.PROJECT_VIEW_ASSIGNED))
    throw new AppError(403, 'You cannot view projects');
  await requireMembership(context, projectId, repository);
};

const requireManageAccess = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  repository: ProjectRepository,
): Promise<void> => {
  if (isAdmin(authorization)) return;
  if (!has(authorization, Permission.PROJECT_MANAGE_ASSIGNED))
    throw new AppError(403, 'You cannot manage this project');
  await requireMembership(context, projectId, repository);
};

export const createProject = async (
  context: TenantContext,
  input: CreateProjectInput,
  repository: ProjectRepository = prismaRepository,
): Promise<ProjectResponse> => {
  try {
    const project = await repository.createWithMember(context.tenantId, input, context.userId);
    await cache.invalidateTenant(context.tenantId, 'projects');
    await publishDomainEvent(
      createDomainEvent('ProjectCreated', context.tenantId, context.userId, {
        projectId: project.id,
        status: project.status,
      }),
    );
    return project;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'A project with that key already exists');
    }
    throw error;
  }
};

export const listProjects = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  input: ListProjectsInput,
  repository: ProjectRepository = prismaRepository,
): Promise<ProjectListResponse> => {
  if (!isAdmin(authorization) && !has(authorization, Permission.PROJECT_VIEW_ASSIGNED)) {
    throw new AppError(403, 'You cannot view projects');
  }
  const cacheable = isAdmin(authorization);
  const cacheKey = cacheKeys.projects(context.tenantId, context.userId, {
    input,
    scope: isAdmin(authorization) ? 'admin' : 'assigned',
  });
  const cached = cacheable ? await cache.get<ProjectListResponse>(cacheKey) : null;
  if (cached) return cached;
  const where: Prisma.ProjectWhereInput = {
    tenantId: context.tenantId,
    ...(input.status ? { status: input.status } : {}),
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' } },
            { key: { contains: input.search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(isAdmin(authorization) ? {} : { members: { some: { userId: context.userId } } }),
  };
  const skip = (input.page - 1) * input.limit;
  const [data, total] = await Promise.all([
    repository.list(where, skip, input.limit),
    repository.count(where),
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
  if (cacheable) await cache.set(cacheKey, result);
  return result;
};

export const getProject = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  repository: ProjectRepository = prismaRepository,
): Promise<ProjectResponse> => {
  const cacheKey = cacheKeys.project(context.tenantId, context.userId, projectId);
  const cached = await cache.get<ProjectResponse>(cacheKey);
  if (cached) {
    await requireViewAccess(context, authorization, projectId, repository);
    return cached;
  }
  const project = await requireProject(context, projectId, repository);
  await requireViewAccess(context, authorization, projectId, repository);
  await cache.set(cacheKey, project);
  return project;
};

export const updateProject = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  input: UpdateProjectInput,
  repository: ProjectRepository = prismaRepository,
): Promise<ProjectResponse> => {
  await requireProject(context, projectId, repository);
  await requireManageAccess(context, authorization, projectId, repository);
  const project = await repository.update(projectId, input);
  await cache.invalidateTenant(context.tenantId, 'projects');
  await publishDomainEvent(
    createDomainEvent('ProjectUpdated', context.tenantId, context.userId, {
      projectId: project.id,
      status: project.status,
    }),
  );
  return project;
};

export const archiveProject = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  repository: ProjectRepository = prismaRepository,
): Promise<ProjectResponse> => {
  await requireProject(context, projectId, repository);
  await requireManageAccess(context, authorization, projectId, repository);
  const project = await repository.update(projectId, { status: ProjectStatus.ARCHIVED });
  await cache.invalidateTenant(context.tenantId, 'projects');
  await publishDomainEvent(
    createDomainEvent('ProjectUpdated', context.tenantId, context.userId, {
      projectId: project.id,
      status: project.status,
    }),
  );
  return project;
};
