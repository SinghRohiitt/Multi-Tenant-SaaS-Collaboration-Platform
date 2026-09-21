import { z } from 'zod';

export const addMemberSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required'),
});

export type AddMemberFormValues = z.infer<typeof addMemberSchema>;
