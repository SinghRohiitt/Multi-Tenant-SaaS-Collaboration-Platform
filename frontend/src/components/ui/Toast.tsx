import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { Button } from './Button';

type ToastProps = {
  title: string;
  message?: string;
  onClose?: () => void;
  tone?: 'info' | 'success' | 'warning' | 'error';
};

export function Toast({ title, message, onClose, tone = 'info' }: ToastProps) {
  const border = {
    info: 'border-cyan-400/40',
    success: 'border-emerald-400/40',
    warning: 'border-amber-400/40',
    error: 'border-rose-400/40',
  }[tone];
  const Icon = { info: Info, success: CheckCircle2, warning: TriangleAlert, error: AlertCircle }[
    tone
  ];
  return (
    <div
      aria-live="polite"
      className={`flex max-w-sm items-start gap-3 rounded-xl border ${border} bg-slate-900 p-4 shadow-2xl shadow-slate-950/40`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-slate-300" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        {message && <div className="mt-1 text-sm text-slate-400">{message}</div>}
      </div>
      {onClose && (
        <Button aria-label="Dismiss notification" onClick={onClose} size="sm" variant="ghost">
          <X aria-hidden="true" className="size-4" />
        </Button>
      )}
    </div>
  );
}
