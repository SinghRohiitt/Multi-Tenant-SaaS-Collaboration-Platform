import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
};

const toneStyles = {
  neutral: 'bg-slate-800 text-slate-300',
  info: 'bg-cyan-400/10 text-cyan-300',
  success: 'bg-emerald-400/10 text-emerald-300',
  warning: 'bg-amber-400/10 text-amber-300',
  danger: 'bg-rose-400/10 text-rose-300',
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}
