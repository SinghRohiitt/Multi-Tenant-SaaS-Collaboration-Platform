import { ProjectStatus } from '@prisma/client';
import { z } from 'zod';

const projectKey = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9_-]{1,19}$/);
const projectFields = {
  key: projectKey,
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(10_000).nullable().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
};

export const createProjectSchema = z.object({
  body: z.object({
    key: projectFields.key,
    name: projectFields.name,
    description: projectFields.description,
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateProjectSchema = z.object({
  body: z
    .object(projectFields)
    .omit({ key: true })
    .partial()
    .refine(
      (value) => Object.values(value).some((field) => field !== undefined),
      'At least one field is required',
    ),
  params: z.object({ id: z.string().cuid() }),
  query: z.object({}),
});

export const projectIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().cuid() }),
  query: z.object({}),
});

export const listProjectsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().min(1).max(100).optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
export type ListProjectsInput = z.infer<typeof listProjectsSchema>['query'];
