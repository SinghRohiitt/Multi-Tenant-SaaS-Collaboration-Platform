import { z } from 'zod';

export const projectMemberParamsSchema = z.object({
  projectId: z.string().cuid(),
});

export const projectMemberDetailParamsSchema = projectMemberParamsSchema.extend({
  userId: z.string().cuid(),
});

export const addProjectMemberSchema = z.object({
  body: z.object({ userId: z.string().cuid() }),
  params: projectMemberParamsSchema,
  query: z.object({}),
});

export const listProjectMembersSchema = z.object({
  body: z.object({}),
  params: projectMemberParamsSchema,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const projectMemberDetailSchema = z.object({
  body: z.object({}),
  params: projectMemberDetailParamsSchema,
  query: z.object({}),
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>['body'];
export type ListProjectMembersInput = z.infer<typeof listProjectMembersSchema>['query'];
