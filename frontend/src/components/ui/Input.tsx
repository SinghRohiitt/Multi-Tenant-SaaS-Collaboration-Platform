import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, id, label, error, ...props },
  ref,
) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-200" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          'min-h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20',
          className,
        )}
        id={inputId}
        {...props}
      />
      {error && (
        <p className="text-xs text-rose-300" id={`${inputId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
});
