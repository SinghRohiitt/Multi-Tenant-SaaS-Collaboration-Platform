import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type ErrorStateProps = { title?: string; description?: string; action?: ReactNode };

export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 px-6 py-10 text-center">
      <AlertCircle aria-hidden="true" className="mx-auto size-8 text-rose-300" />
      <h2 className="mt-3 text-base font-semibold text-slate-100">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
