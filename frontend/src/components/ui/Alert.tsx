import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type AlertProps = {
  title?: string;
  children: ReactNode;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  className?: string;
};

const alertStyles = {
  info: { icon: Info, classes: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200' },
  success: {
    icon: CheckCircle2,
    classes: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  },
  warning: { icon: TriangleAlert, classes: 'border-amber-400/30 bg-amber-400/10 text-amber-200' },
  danger: { icon: AlertCircle, classes: 'border-rose-400/30 bg-rose-400/10 text-rose-200' },
};

export function Alert({ title, children, tone = 'info', className }: AlertProps) {
  const { icon: Icon, classes } = alertStyles[tone];
  return (
    <div
      className={cn('flex gap-3 rounded-lg border p-4 text-sm', classes, className)}
      role="alert"
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className="mt-1 opacity-90">{children}</div>
      </div>
    </div>
  );
}
