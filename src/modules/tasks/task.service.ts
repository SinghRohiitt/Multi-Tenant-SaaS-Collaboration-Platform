import { Prisma, TaskStatus } from '@prisma/client';

import type { AuthorizationContext } from '../../common/authorization/authorization.middleware.js';
import { Permission, RoleName } from '../../common/authorization/rbac.js';
import { AppError } from '../../common/errors/app-error.js';
import type { TenantContext } from '../../common/tenant/tenant-context.js';
import { cache, cacheKeys } from '../../cache/redis-cache.js';
import { prisma } from '../../database/prisma.js';
import { createDomainEvent, publishDomainEvent } from '../../events/index.js';
import type { CreateTaskInput, ListTasksInput, UpdateTaskInput } from './task.schemas.js';

const taskSelect = {
  id: true,
  tenantId: true,
  projectId: true,
  assigneeId: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  assignee: { select: { id: true, email: true, displayName: true, status: true } },
} satisfies Prisma.TaskSelect;

export type TaskResponse = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;
export type TaskListResponse = {
  data: TaskResponse[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type TaskRepository = {
  projectExists: (tenantId: string, projectId: string) => Promise<boolean>;
  projectMember: (tenantId: string, projectId: string, userId: string) => Promise<boolean>;
  find: (tenantId: string, taskId: string) => Promise<TaskResponse | null>;
  create: (tenantId: string, projectId: string, input: CreateTaskInput) => Promise<TaskResponse>;
  update: (tenantId: string, taskId: string, input: UpdateTaskInput) => Promise<TaskResponse>;
  assign: (tenantId: string, taskId: string, assigneeId: string | null) => Promise<TaskResponse>;
  list: (where: Prisma.TaskWhereInput, skip: number, take: number) => Promise<TaskResponse[]>;
  count: (where: Prisma.TaskWhereInput) => Promise<number>;
};

const repository: TaskRepository = {
  projectExists: async (tenantId, projectId) =>
    Boolean(
      await prisma.project.findFirst({ where: { id: projectId, tenantId }, select: { id: true } }),
    ),
  projectMember: async (tenantId, projectId, userId) =>
    Boolean(
      await prisma.projectMember.findFirst({
        where: { tenantId, projectId, userId },
        select: { projectId: true },
      }),
    ),
  find: (tenantId, taskId) =>
    prisma.task.findFirst({ where: { id: taskId, tenantId }, select: taskSelect }),
  create: (tenantId, projectId, input) =>
    prisma.task.create({
      data: {
        tenantId,
        projectId,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate,
        assigneeId: input.assigneeId,
      },
      select: taskSelect,
    }),
  update: async (tenantId, taskId, input) =>
    prisma.$transaction(async (transaction) => {
      const updated = await transaction.task.updateMany({
        where: { id: taskId, tenantId },
        data: input,
      });
      if (updated.count !== 1) throw new AppError(404, 'Task not found');
      return transaction.task.findFirstOrThrow({
        where: { id: taskId, tenantId },
        select: taskSelect,
      });
    }),
  assign: async (tenantId, taskId, assigneeId) => {
    return prisma.$transaction(async (transaction) => {
      const currentTask = await transaction.task.findFirst({
        where: { id: taskId, tenantId },
        select: { projectId: true },
      });
      if (!currentTask) throw new AppError(404, 'Task not found');
      if (assigneeId) {
        const membership = await transaction.projectMember.findFirst({
          where: { tenantId, userId: assigneeId, projectId: currentTask.projectId },
          select: { projectId: true },
        });
        if (!membership) throw new AppError(404, 'Assignee is not a member of this project');
      }
      const updated = await transaction.task.updateMany({
        where: { id: taskId, tenantId },
        data: { assigneeId },
      });
      if (updated.count !== 1) throw new AppError(404, 'Task not found');
      return transaction.task.findFirstOrThrow({
        where: { id: taskId, tenantId },
        select: taskSelect,
      });
    });
  },
  list: (where, skip, take) =>
    prisma.task.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: taskSelect }),
  count: (where) => prisma.task.count({ where }),
};

const isAdmin = (authorization: AuthorizationContext): boolean =>
  authorization.roles.includes(RoleName.ADMIN);
const has = (authorization: AuthorizationContext, permission: Permission): boolean =>
  authorization.permissions.includes(permission);

const requireProject = async (context: TenantContext, projectId: string, db: TaskRepository) => {
  if (!(await db.projectExists(context.tenantId, projectId)))
    throw new AppError(404, 'Project not found');
};

const requireProjectMember = async (
  context: TenantContext,
  projectId: string,
  db: TaskRepository,
) => {
  if (!(await db.projectMember(context.tenantId, projectId, context.userId))) {
    throw new AppError(403, 'You are not authorized for this project');
  }
};

const requireProjectTaskAccess = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  db: TaskRepository,
) => {
  if (isAdmin(authorization)) return;
  if (
    !has(authorization, Permission.TASK_VIEW_ASSIGNED) &&
    !has(authorization, Permission.TASK_UPDATE) &&
    !has(authorization, Permission.TASK_CREATE)
  ) {
    throw new AppError(403, 'You cannot access tasks in this project');
  }
  await requireProjectMember(context, projectId, db);
};

export const createTask = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  input: CreateTaskInput,
  db: TaskRepository = repository,
): Promise<TaskResponse> => {
  await requireProject(context, projectId, db);
  if (!isAdmin(authorization)) {
    if (!has(authorization, Permission.TASK_CREATE))
      throw new AppError(403, 'You cannot create tasks');
    await requireProjectMember(context, projectId, db);
  }
  if (
    input.assigneeId &&
    !(await db.projectMember(context.tenantId, projectId, input.assigneeId))
  ) {
    throw new AppError(404, 'Assignee is not a member of this project');
  }
  try {
    const task = await db.create(context.tenantId, projectId, input);
    await cache.invalidateTenant(context.tenantId, 'tasks');
    await publishDomainEvent(
      createDomainEvent('TaskCreated', context.tenantId, context.userId, {
        taskId: task.id,
        projectId: task.projectId,
        status: task.status,
        priority: task.priority,
      }),
    );
    return task;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new AppError(400, 'Task references an invalid project or assignee');
    }
    throw error;
  }
};

export const listTasks = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  projectId: string,
  input: ListTasksInput,
  db: TaskRepository = repository,
): Promise<TaskListResponse> => {
  await requireProject(context, projectId, db);
  await requireProjectTaskAccess(context, authorization, projectId, db);
  const memberOnly =
    !isAdmin(authorization) &&
    !has(authorization, Permission.TASK_UPDATE) &&
    !has(authorization, Permission.TASK_CREATE);
  const cacheKey = cacheKeys.tasks(context.tenantId, context.userId, projectId, {
    input,
    scope: memberOnly ? 'assigned' : 'project',
  });
  const cached = await cache.get<TaskListResponse>(cacheKey);
  if (cached) return cached;
  const where: Prisma.TaskWhereInput = {
    tenantId: context.tenantId,
    projectId,
    ...(input.status ? { status: input.status } : {}),
    ...(input.priority ? { priority: input.priority } : {}),
    ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
    ...(input.search
      ? {
          OR: [
            { title: { contains: input.search, mode: 'insensitive' } },
            { description: { contains: input.search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(memberOnly ? { assigneeId: context.userId } : {}),
  };
  const skip = (input.page - 1) * input.limit;
  const [data, total] = await Promise.all([db.list(where, skip, input.limit), db.count(where)]);
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

export const getTask = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  taskId: string,
  db: TaskRepository = repository,
): Promise<TaskResponse> => {
  const cacheKey = cacheKeys.task(context.tenantId, context.userId, taskId);
  const cached = await cache.get<TaskResponse>(cacheKey);
  if (cached) {
    await requireProjectTaskAccess(context, authorization, cached.projectId, db);
    if (
      !isAdmin(authorization) &&
      !has(authorization, Permission.TASK_UPDATE) &&
      cached.assigneeId !== context.userId
    ) {
      throw new AppError(403, 'You cannot access this task');
    }
    return cached;
  }
  const task = await db.find(context.tenantId, taskId);
  if (!task) throw new AppError(404, 'Task not found');
  await requireProjectTaskAccess(context, authorization, task.projectId, db);
  if (
    !isAdmin(authorization) &&
    !has(authorization, Permission.TASK_UPDATE) &&
    task.assigneeId !== context.userId
  ) {
    throw new AppError(403, 'You cannot access this task');
  }
  await cache.set(cacheKey, task);
  return task;
};

export const updateTask = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  taskId: string,
  input: UpdateTaskInput,
  db: TaskRepository = repository,
): Promise<TaskResponse> => {
  const task = await getTask(context, authorization, taskId, db);
  if (!isAdmin(authorization) && !has(authorization, Permission.TASK_UPDATE)) {
    if (
      !has(authorization, Permission.TASK_UPDATE_ASSIGNED) ||
      task.assigneeId !== context.userId
    ) {
      throw new AppError(403, 'You cannot update this task');
    }
    if (input.title !== undefined || input.description !== undefined) {
      throw new AppError(403, 'You can only update permitted task fields');
    }
  } else if (!isAdmin(authorization)) {
    await requireProjectMember(context, task.projectId, db);
  }
  const updated = await db.update(context.tenantId, taskId, input);
  await cache.invalidateTenant(context.tenantId, 'tasks');
  await publishDomainEvent(
    createDomainEvent('TaskUpdated', context.tenantId, context.userId, {
      taskId: updated.id,
      projectId: updated.projectId,
      status: updated.status,
      priority: updated.priority,
    }),
  );
  return updated;
};

export const assignTask = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  taskId: string,
  assigneeId: string | null,
  db: TaskRepository = repository,
): Promise<TaskResponse> => {
  const task = await db.find(context.tenantId, taskId);
  if (!task) throw new AppError(404, 'Task not found');
  if (!isAdmin(authorization)) {
    if (
      !has(authorization, Permission.PROJECT_MEMBERS_MANAGE) &&
      !has(authorization, Permission.TASK_UPDATE)
    ) {
      throw new AppError(403, 'You cannot assign tasks');
    }
    await requireProjectMember(context, task.projectId, db);
  }
  if (assigneeId && !(await db.projectMember(context.tenantId, task.projectId, assigneeId))) {
    throw new AppError(404, 'Assignee is not a member of this project');
  }
  const updated = await db.assign(context.tenantId, taskId, assigneeId);
  await cache.invalidateTenant(context.tenantId, 'tasks');
  await publishDomainEvent(
    createDomainEvent('TaskAssigned', context.tenantId, context.userId, {
      taskId: updated.id,
      projectId: updated.projectId,
      assigneeId: updated.assigneeId,
    }),
  );
  return updated;
};

export const archiveTask = async (
  context: TenantContext,
  authorization: AuthorizationContext,
  taskId: string,
  db: TaskRepository = repository,
): Promise<TaskResponse> => {
  const task = await db.find(context.tenantId, taskId);
  if (!task) throw new AppError(404, 'Task not found');
  if (!isAdmin(authorization)) {
    if (!has(authorization, Permission.TASK_UPDATE))
      throw new AppError(403, 'You cannot archive tasks');
    await requireProjectMember(context, task.projectId, db);
  }
  const updated = await db.update(context.tenantId, taskId, { status: TaskStatus.ARCHIVED });
  await cache.invalidateTenant(context.tenantId, 'tasks');
  await publishDomainEvent(
    createDomainEvent('TaskUpdated', context.tenantId, context.userId, {
      taskId: updated.id,
      projectId: updated.projectId,
      status: updated.status,
      priority: updated.priority,
    }),
  );
  return updated;
};
