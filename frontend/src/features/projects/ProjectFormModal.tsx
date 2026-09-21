import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Dialog, Input, Select, Textarea } from '@/components/ui';
import type { CreateProjectPayload, UpdateProjectPayload } from '@/services/projects.api';
import type { Project, ProjectStatus } from '@/types/api';
import { projectFormSchema, type ProjectFormValues } from './project.schemas';

type ProjectFormModalProps = {
  open: boolean;
  project?: Project | null;
  mode: 'create' | 'edit';
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload | UpdateProjectPayload) => Promise<boolean>;
};

const statuses: ProjectStatus[] = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'];

export function ProjectFormModal({
  open,
  project,
  mode,
  loading = false,
  error,
  onClose,
  onSubmit,
}: ProjectFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      key: project?.key ?? '',
      name: project?.name ?? '',
      description: project?.description ?? '',
      status: project?.status ?? 'PLANNING',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        key: project?.key ?? '',
        name: project?.name ?? '',
        description: project?.description ?? '',
        status: project?.status ?? 'PLANNING',
      });
    }
  }, [open, project, reset]);

  async function submit(values: ProjectFormValues) {
    const payload =
      mode === 'create'
        ? { key: values.key, name: values.name, description: values.description || null }
        : {
            name: values.name,
            description: values.description || null,
            status: values.status,
          };
    if (await onSubmit(payload)) onClose();
  }

  return (
    <Dialog
      open={open}
      title={mode === 'create' ? 'Create project' : 'Edit project'}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        {error && (
          <Alert tone="danger" title="Project update failed">
            {error}
          </Alert>
        )}
        <Input
          disabled={mode === 'edit'}
          error={errors.key?.message}
          label="Project key"
          placeholder="APP"
          {...register('key')}
        />
        <Input error={errors.name?.message} label="Project name" {...register('name')} />
        <Textarea
          error={errors.description?.message}
          label="Description"
          {...register('description')}
        />
        <Select error={errors.status?.message} label="Status" {...register('status')}>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.replace('_', ' ')}
            </option>
          ))}
        </Select>
        <div className="flex justify-end gap-3 pt-2">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button loading={loading} type="submit">
            {mode === 'create' ? 'Create project' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
