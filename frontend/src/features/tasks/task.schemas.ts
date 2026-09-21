import { z } from 'zod';

export const taskFormSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  title: z.string().trim().min(1, 'Task title is required').max(240),
  description: z.string().trim().max(20_000, 'Description is too long').nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().nullable(),
  assigneeId: z.string().trim().nullable(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
