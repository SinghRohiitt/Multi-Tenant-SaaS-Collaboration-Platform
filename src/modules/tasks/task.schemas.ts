import { TaskPriority, TaskStatus } from '@prisma/client';
import { z } from 'zod';

const dateValue = z.coerce.date().refine((date) => !Number.isNaN(date.getTime()), 'Invalid date');
const taskFields = {
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(20_000).nullable().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: dateValue.nullable().optional(),
};

export const createTaskSchema = z.object({
  body: z.object({
    ...taskFields,
    title: taskFields.title,
    assigneeId: z.string().cuid().nullable().optional(),
  }),
  params: z.object({ projectId: z.string().cuid() }),
  query: z.object({}),
});

export const listTasksSchema = z.object({
  body: z.object({}),
  params: z.object({ projectId: z.string().cuid() }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().min(1).max(100).optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    assigneeId: z.string().cuid().optional(),
  }),
});

export const taskIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().cuid() }),
  query: z.object({}),
});

export const updateTaskSchema = z.object({
  body: z
    .object(taskFields)
    .partial()
    .refine(
      (value) => Object.values(value).some((field) => field !== undefined),
      'At least one field is required',
    ),
  params: z.object({ id: z.string().cuid() }),
  query: z.object({}),
});

export const assignTaskSchema = z.object({
  body: z.object({ assigneeId: z.string().cuid().nullable() }),
  params: z.object({ id: z.string().cuid() }),
  query: z.object({}),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type ListTasksInput = z.infer<typeof listTasksSchema>['query'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
