import { TaskPriority, TaskStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import type { AuthorizationContext } from '../src/common/authorization/authorization.middleware.js';
import { Permission, RoleName, rolePermissions } from '../src/common/authorization/rbac.js';
import type { TenantContext } from '../src/common/tenant/tenant-context.js';
import {
  archiveTask,
  assignTask,
  createTask,
  getTask,
  listTasks,
  updateTask,
  type TaskRepository,
  type TaskResponse,
} from '../src/modules/tasks/task.service.js';
import {
  createTaskSchema,
  listTasksSchema,
  updateTaskSchema,
} from '../src/modules/tasks/task.schemas.js';

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

const task = (changes: Partial<TaskResponse> = {}): TaskResponse => ({
  id: 'task-a',
  tenantId: 'tenant-a',
  projectId: 'project-a',
  assigneeId: 'user-a',
  title: 'Implement task module',
  description: null,
  status: TaskStatus.TODO,
  priority: TaskPriority.HIGH,
  dueDate: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  assignee: { id: 'user-a', email: 'user@example.com', displayName: 'User', status: 'ACTIVE' },
  ...changes,
});

const repository = (overrides: Partial<TaskRepository> = {}): TaskRepository => ({
  projectExists: vi.fn().mockResolvedValue(true),
  projectMember: vi.fn().mockResolvedValue(true),
  find: vi.fn().mockResolvedValue(task()),
  create: vi.fn().mockResolvedValue(task()),
  update: vi.fn().mockImplementation(async (_tenantId, _taskId, input) => task(input)),
  assign: vi
    .fn()
    .mockImplementation(async (_tenantId, _taskId, assigneeId) => task({ assigneeId })),
  list: vi.fn().mockResolvedValue([task()]),
  count: vi.fn().mockResolvedValue(12),
  ...overrides,
});

describe('task service', () => {
  it('creates a tenant-scoped task assigned to a project member', async () => {
    const db = repository();

    await expect(
      createTask(tenantA, manager, 'project-a', { title: 'Task', assigneeId: 'user-b' }, db),
    ).resolves.toMatchObject({ projectId: 'project-a' });
    expect(db.create).toHaveBeenCalledWith('tenant-a', 'project-a', {
      title: 'Task',
      assigneeId: 'user-b',
    });
  });

  it('supports pagination, search, status, priority, and tenant filtering', async () => {
    const db = repository();

    const result = await listTasks(
      tenantA,
      manager,
      'project-a',
      {
        page: 2,
        limit: 10,
        search: 'module',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
      },
      db,
    );

    expect(result.meta).toEqual({ page: 2, limit: 10, total: 12, totalPages: 2 });
    expect(db.list).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-a',
        projectId: 'project-a',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        OR: [
          { title: { contains: 'module', mode: 'insensitive' } },
          { description: { contains: 'module', mode: 'insensitive' } },
        ],
      },
      10,
      10,
    );
  });

  it('allows members to update permitted fields but not task content', async () => {
    const db = repository();

    await expect(
      updateTask(tenantA, member, 'task-a', { status: TaskStatus.DONE }, db),
    ).resolves.toMatchObject({
      status: TaskStatus.DONE,
    });
    await expect(
      updateTask(tenantA, member, 'task-a', { title: 'Not allowed' }, db),
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('rejects cross-tenant tasks and assignees', async () => {
    const missingTask = repository({ find: vi.fn().mockResolvedValue(null) });
    const missingMember = repository({
      projectMember: vi
        .fn()
        .mockImplementation((_tenantId, _projectId, userId) =>
          Promise.resolve(userId === 'user-a'),
        ),
    });

    await expect(getTask(tenantA, admin, 'tenant-b-task', missingTask)).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(
      assignTask(tenantA, manager, 'task-a', 'tenant-b-user', missingMember),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('archives a task and supports explicit assignment', async () => {
    const db = repository();

    await expect(archiveTask(tenantA, manager, 'task-a', db)).resolves.toMatchObject({
      status: TaskStatus.ARCHIVED,
    });
    await expect(assignTask(tenantA, manager, 'task-a', 'user-b', db)).resolves.toMatchObject({
      assigneeId: 'user-b',
    });
    expect(db.assign).toHaveBeenCalledWith('tenant-a', 'task-a', 'user-b');
  });
});

describe('task DTO validation', () => {
  it('rejects invalid task data and pagination', () => {
    expect(
      createTaskSchema.safeParse({ body: { title: '' }, params: { projectId: 'bad' }, query: {} })
        .success,
    ).toBe(false);
    expect(
      listTasksSchema.safeParse({ body: {}, params: { projectId: 'bad' }, query: { page: 0 } })
        .success,
    ).toBe(false);
    expect(updateTaskSchema.safeParse({ body: {}, params: { id: 'bad' }, query: {} }).success).toBe(
      false,
    );
  });

  it('parses due dates and task status', () => {
    const result = createTaskSchema.parse({
      body: { title: 'Task', status: 'TODO', dueDate: '2026-12-31T00:00:00.000Z' },
      params: { projectId: 'cprojecta' },
      query: {},
    });
    expect(result.body.status).toBe(TaskStatus.TODO);
    expect(result.body.dueDate).toBeInstanceOf(Date);
    expect(rolePermissions.MEMBER).toContain(Permission.TASK_UPDATE_ASSIGNED);
  });
});
