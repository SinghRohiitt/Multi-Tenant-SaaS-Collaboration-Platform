import { z } from 'zod';

const email = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform((value) => value.toLowerCase());
const password = z.string().min(12).max(128);

export const registerSchema = z.object({
  body: z.object({
    tenantId: z.string().cuid(),
    email,
    displayName: z.string().trim().min(1).max(100),
    password,
  }),
  params: z.object({}),
  query: z.object({}),
});

export const loginSchema = z.object({
  body: z.object({ tenantId: z.string().cuid(), email, password }),
  params: z.object({}),
  query: z.object({}),
});

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(32).max(512) }),
  params: z.object({}),
  query: z.object({}),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
