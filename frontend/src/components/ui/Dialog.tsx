import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';

type DialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export function Dialog({ open, title, children, onClose, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      className={`w-[calc(100%-2rem)] max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl shadow-slate-950/60 backdrop:bg-slate-950/70 ${className ?? ''}`}
      onCancel={onClose}
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <h2 className="text-base font-semibold" id="dialog-title">
          {title}
        </h2>
        <Button aria-label="Close dialog" onClick={onClose} size="sm" variant="ghost">
          <X aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}

export function Modal(props: DialogProps) {
  return <Dialog {...props} />;
}
