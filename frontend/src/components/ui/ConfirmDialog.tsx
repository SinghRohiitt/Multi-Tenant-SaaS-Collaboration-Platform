import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Dialog } from './Dialog';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
  loading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <div className="flex gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-300" />
        <p className="text-sm leading-6 text-slate-400">{description}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button onClick={onClose} variant="ghost">
          Cancel
        </Button>
        <Button loading={loading} onClick={onConfirm} variant="danger">
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
