import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Dialog, Input, Select, Textarea } from '@/components/ui';
import type { CreateTaskPayload, UpdateTaskPayload } from '@/services/tasks.api';
import type { Project, Task } from '@/types/api';
import { taskFormSchema, type TaskFormValues } from './task.schemas';

type TaskFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  task?: Task | null;
  projects: Project[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: TaskFormValues) => Promise<boolean>;
};

const statuses = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export function TaskFormModal({
  open,
  mode,
  task,
  projects,
  loading = false,
  error,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      projectId: task?.projectId ?? projects[0]?.id ?? '',
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status === 'IN_PROGRESS' || task?.status === 'DONE' ? task.status : 'TODO',
      priority: task?.priority ?? 'MEDIUM',
      dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
      assigneeId: task?.assigneeId ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        projectId: task?.projectId ?? projects[0]?.id ?? '',
        title: task?.title ?? '',
        description: task?.description ?? '',
        status: task?.status === 'IN_PROGRESS' || task?.status === 'DONE' ? task.status : 'TODO',
        priority: task?.priority ?? 'MEDIUM',
        dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
        assigneeId: task?.assigneeId ?? '',
      });
    }
  }, [open, projects, reset, task]);

  async function submit(values: TaskFormValues) {
    if (await onSubmit(values)) onClose();
  }

  return (
    <Dialog open={open} title={mode === 'create' ? 'Create task' : 'Edit task'} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        {error && (
          <Alert title="Task action failed" tone="danger">
            {error}
          </Alert>
        )}
        <Select
          disabled={mode === 'edit'}
          error={errors.projectId?.message}
          label="Project"
          {...register('projectId')}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.key} - {project.name}
            </option>
          ))}
        </Select>
        <Input error={errors.title?.message} label="Title" {...register('title')} />
        <Textarea
          error={errors.description?.message}
          label="Description"
          {...register('description')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select error={errors.status?.message} label="Status" {...register('status')}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </Select>
          <Select error={errors.priority?.message} label="Priority" {...register('priority')}>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            error={errors.dueDate?.message}
            label="Due date"
            type="date"
            {...register('dueDate')}
          />
          <Input
            error={errors.assigneeId?.message}
            label="Assignee user ID"
            placeholder="Optional user ID"
            {...register('assigneeId')}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button loading={loading} type="submit">
            {mode === 'create' ? 'Create task' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export type TaskSubmitPayload = CreateTaskPayload | UpdateTaskPayload;
