import { z } from 'zod';

const key = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9_-]{1,19}$/, 'Use 2-20 uppercase letters, numbers, hyphens, or underscores');

export const projectFormSchema = z.object({
  key,
  name: z.string().trim().min(1, 'Project name is required').max(160),
  description: z.string().trim().max(10_000, 'Description is too long').nullable(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
