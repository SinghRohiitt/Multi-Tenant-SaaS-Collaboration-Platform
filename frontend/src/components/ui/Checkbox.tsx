import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, id, label, ...props },
  ref,
) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-slate-300">
      <input
        ref={ref}
        className={cn(
          'size-4 rounded border-slate-600 bg-slate-900 text-cyan-400 accent-cyan-400 focus:ring-2 focus:ring-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        id={id}
        type="checkbox"
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
});
