import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Alert, Button, Dialog, Input } from '@/components/ui';
import { addMemberSchema, type AddMemberFormValues } from './member.schemas';

type AddMemberModalProps = {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: AddMemberFormValues) => Promise<boolean>;
};

export function AddMemberModal({
  open,
  loading = false,
  error,
  onClose,
  onSubmit,
}: AddMemberModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddMemberFormValues>({ resolver: zodResolver(addMemberSchema) });

  async function submit(values: AddMemberFormValues) {
    if (await onSubmit(values)) {
      reset();
      onClose();
    }
  }

  return (
    <Dialog open={open} title="Add project member" onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        {error && (
          <Alert title="Unable to add member" tone="danger">
            {error}
          </Alert>
        )}
        <p className="text-sm leading-6 text-slate-400">
          Enter the ID of an existing user in this organization. The backend will verify tenant
          membership and permissions.
        </p>
        <Input
          autoComplete="off"
          error={errors.userId?.message}
          label="User ID"
          placeholder="cuid"
          {...register('userId')}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button loading={loading} type="submit">
            Add member
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
