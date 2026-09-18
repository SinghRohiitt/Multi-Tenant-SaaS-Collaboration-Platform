import { describe, expect, it } from 'vitest';

import { AppError } from '../src/common/errors/app-error.js';
import { getTenantContext } from '../src/common/tenant/tenant-context.js';
import {
  addProjectMemberSchema,
  listProjectMembersSchema,
} from '../src/modules/project-members/member.schemas.js';
import {
  createProjectSchema,
  updateProjectSchema,
} from '../src/modules/projects/project.schemas.js';
import {
  assignTaskSchema,
  createTaskSchema,
  updateTaskSchema,
} from '../src/modules/tasks/task.schemas.js';

describe('business boundary validation', () => {
  it('requires an authenticated tenant context', () => {
    expect(() => getTenantContext({} as never)).toThrowError(
      new AppError(401, 'Authentication is required'),
    );
  });

  it('rejects invalid project and member DTOs', () => {
    expect(
      createProjectSchema.safeParse({
        body: { key: '1-invalid', name: '' },
        params: {},
        query: {},
      }).success,
    ).toBe(false);
    expect(
      updateProjectSchema.safeParse({
        body: {},
        params: { id: 'not-a-cuid' },
        query: {},
      }).success,
    ).toBe(false);
    expect(
      addProjectMemberSchema.safeParse({
        body: { userId: 'not-a-cuid' },
        params: { projectId: 'not-a-cuid' },
        query: {},
      }).success,
    ).toBe(false);
    expect(
      listProjectMembersSchema.safeParse({
        body: {},
        params: { projectId: 'cmj9w0x6d0000qzrm8f3x2p7a' },
        query: { page: 0 },
      }).success,
    ).toBe(false);
  });

  it('rejects invalid task DTOs and assignment IDs', () => {
    expect(
      createTaskSchema.safeParse({
        body: { title: '' },
        params: { projectId: 'not-a-cuid' },
        query: {},
      }).success,
    ).toBe(false);
    expect(
      updateTaskSchema.safeParse({ body: {}, params: { id: 'not-a-cuid' }, query: {} }).success,
    ).toBe(false);
    expect(
      assignTaskSchema.safeParse({
        body: { assigneeId: 'not-a-cuid' },
        params: { id: 'cmj9w0x6d0000qzrm8f3x2p7a' },
        query: {},
      }).success,
    ).toBe(false);
  });
});
