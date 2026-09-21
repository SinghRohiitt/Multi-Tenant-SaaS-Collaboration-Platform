import { LoaderCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

type SpinnerProps = { label?: string; className?: string };

export function Spinner({ label = 'Loading', className }: SpinnerProps) {
  return (
    <LoaderCircle
      aria-label={label}
      className={cn('size-5 animate-spin text-cyan-400', className)}
      role="status"
    />
  );
}
