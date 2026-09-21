import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, id, label, error, ...props },
  ref,
) {
  const textareaId = id ?? props.name;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-200" htmlFor={textareaId}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        aria-invalid={Boolean(error)}
        className={cn(
          'min-h-28 w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20',
          className,
        )}
        id={textareaId}
        {...props}
      />
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
});
