import { z } from 'zod';

const email = z.string().trim().email('Enter a valid email address');
const tenantId = z.string().trim().min(1, 'Organization ID is required');
const password = z.string().min(12, 'Password must be at least 12 characters').max(128);

export const loginSchema = z.object({ tenantId, email, password });
export const registerSchema = loginSchema.extend({
  displayName: z.string().trim().min(1, 'Display name is required').max(100),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
