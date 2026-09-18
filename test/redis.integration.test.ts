import { ProjectStatus, TaskPriority, TaskStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const cacheState = vi.hoisted(() => {
  const values = new Map<string, unknown>();
  return {
    values,
    get: vi.fn(async <T>(key: string): Promise<T | null> => (values.get(key) as T) ?? null),
    set: vi.fn(async <T>(key: string, value: T): Promise<void> => {
      values.set(key, value);
    }),
    invalidateTenant: vi.fn(async (tenantId: string, resource: string): Promise<void> => {
      for (const key of values.keys()) {
        if (key.startsWith(`tenant:${tenantId}:${resource}:`)) values.delete(key);
      }
    }),
  };
});

vi.mock('../src/cache/redis-cache.js', async () => {
  const actual = await vi.importActual<typeof import('../src/cache/redis-cache.js')>(
    '../src/cache/redis-cache.js',
  );
  return { ...actual, cache: cacheState };
});

import type { AuthorizationContext } from '../src/common/authorization/authorization.middleware.js';
import { rolePermissions, RoleName } from '../src/common/authorization/rbac.js';
import type { TenantContext } from '../src/common/tenant/tenant-context.js';
import {
  listProjects,
  updateProject,
  type ProjectRepository,
  type ProjectResponse,
} from '../src/modules/projects/project.service.js';
import {
  listTasks,
  type TaskRepository,
  type TaskResponse,
} from '../src/modules/tasks/task.service.js';
import {
  listMembers,
  type ProjectMemberRepository,
  type ProjectMemberResponse,
} from '../src/modules/project-members/member.service.js';

const admin: AuthorizationContext = { roles: [RoleName.ADMIN], permissions: rolePermissions.ADMIN };
const tenantA: TenantContext = { tenantId: 'tenant-a', userId: 'user-a' };
const tenantB: TenantContext = { tenantId: 'tenant-b', userId: 'user-a' };
const listInput = { page: 1, limit: 10 };

const project = (tenantId = 'tenant-a'): ProjectResponse => ({
  id: 'project-a',
  tenantId,
  key: 'ALPHA',
  name: 'Alpha',
  description: null,
  status: ProjectStatus.PLANNING,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

const task = (): TaskResponse => ({
  id: 'task-a',
  tenantId: 'tenant-a',
  projectId: 'project-a',
  assigneeId: null,
  title: 'Task',
  description: null,
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  dueDate: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  assignee: null,
});

const member = (): ProjectMemberResponse => ({
  projectId: 'project-a',
  userId: 'user-b',
  tenantId: 'tenant-a',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  user: { id: 'user-b', email: 'user@example.com', displayName: 'User', status: 'ACTIVE' },
});

const projectRepository = (overrides: Partial<ProjectRepository> = {}): ProjectRepository => ({
  create: vi.fn(),
  addMember: vi.fn(),
  findByTenant: vi.fn().mockResolvedValue(project()),
  hasMembership: vi.fn().mockResolvedValue(true),
  update: vi.fn().mockResolvedValue(project()),
  list: vi.fn().mockResolvedValue([project()]),
  count: vi.fn().mockResolvedValue(1),
  ...overrides,
});

const taskRepository = (overrides: Partial<TaskRepository> = {}): TaskRepository => ({
  projectExists: vi.fn().mockResolvedValue(true),
  projectMember: vi.fn().mockResolvedValue(true),
  find: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  assign: vi.fn(),
  list: vi.fn().mockResolvedValue([task()]),
  count: vi.fn().mockResolvedValue(1),
  ...overrides,
});

const memberRepository = (
  overrides: Partial<ProjectMemberRepository> = {},
): ProjectMemberRepository => ({
  projectExists: vi.fn().mockResolvedValue(true),
  userExists: vi.fn(),
  isMember: vi.fn().mockResolvedValue(true),
  create: vi.fn(),
  remove: vi.fn(),
  find: vi.fn(),
  list: vi.fn().mockResolvedValue([member()]),
  count: vi.fn().mockResolvedValue(1),
  ...overrides,
});

describe('Redis-backed service caching', () => {
  beforeEach(() => {
    cacheState.values.clear();
    vi.clearAllMocks();
  });

  it('caches project list misses and serves subsequent hits', async () => {
    const db = projectRepository();

    await listProjects(tenantA, admin, listInput, db);
    await listProjects(tenantA, admin, listInput, db);

    expect(db.list).toHaveBeenCalledTimes(1);
    expect(db.count).toHaveBeenCalledTimes(1);
    expect(cacheState.set).toHaveBeenCalledTimes(1);
  });

  it('keeps cache entries isolated by tenant', async () => {
    const db = projectRepository({
      list: vi.fn().mockImplementation(async (where) => [project(where.tenantId as string)]),
    });

    const first = await listProjects(tenantA, admin, listInput, db);
    const second = await listProjects(tenantB, admin, listInput, db);

    expect(first.data[0].tenantId).toBe('tenant-a');
    expect(second.data[0].tenantId).toBe('tenant-b');
    expect(db.list).toHaveBeenCalledTimes(2);
  });

  it('caches task and member list reads with their existing key helpers', async () => {
    const tasks = taskRepository();
    const members = memberRepository();

    await listTasks(tenantA, admin, 'project-a', listInput, tasks);
    await listTasks(tenantA, admin, 'project-a', listInput, tasks);
    await listMembers(tenantA, admin, 'project-a', listInput, members);
    await listMembers(tenantA, admin, 'project-a', listInput, members);

    expect(tasks.list).toHaveBeenCalledTimes(1);
    expect(members.list).toHaveBeenCalledTimes(1);
  });

  it('invalidates project list caches after a successful update', async () => {
    const db = projectRepository();

    await listProjects(tenantA, admin, listInput, db);
    await updateProject(tenantA, admin, 'project-a', { name: 'Renamed' }, db);

    expect(cacheState.invalidateTenant).toHaveBeenCalledWith('tenant-a', 'projects');
    await listProjects(tenantA, admin, listInput, db);
    expect(db.list).toHaveBeenCalledTimes(2);
  });
});
