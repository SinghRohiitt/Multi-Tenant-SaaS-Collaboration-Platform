import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

type ToastProps = {
  title: string;
  children?: ReactNode;
  onClose?: () => void;
  tone?: 'info' | 'success' | 'danger';
};

export function Toast({ title, children, onClose, tone = 'info' }: ToastProps) {
  const border = {
    info: 'border-cyan-400/40',
    success: 'border-emerald-400/40',
    danger: 'border-rose-400/40',
  }[tone];
  return (
    <div
      aria-live="polite"
      className={`flex max-w-sm items-start gap-3 rounded-xl border ${border} bg-slate-900 p-4 shadow-2xl shadow-slate-950/40`}
      role="status"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        {children && <div className="mt-1 text-sm text-slate-400">{children}</div>}
      </div>
      {onClose && (
        <Button aria-label="Dismiss notification" onClick={onClose} size="sm" variant="ghost">
          <X aria-hidden="true" className="size-4" />
        </Button>
      )}
    </div>
  );
}
