import { cn } from '@/utils/cn';

type SkeletonProps = { className?: string };

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-slate-800', className)} />
  );
}
