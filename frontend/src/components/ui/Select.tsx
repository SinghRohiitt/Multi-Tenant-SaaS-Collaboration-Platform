import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, id, label, error, children, ...props },
  ref,
) {
  const selectId = id ?? props.name;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-200" htmlFor={selectId}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={Boolean(error)}
          className={cn(
            'min-h-10 w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 px-3 pr-10 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20',
            className,
          )}
          id={selectId}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
        />
      </div>
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
});
