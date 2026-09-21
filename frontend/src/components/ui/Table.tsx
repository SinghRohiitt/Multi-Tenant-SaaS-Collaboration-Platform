import type { HTMLAttributes, TableHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className={cn('w-full min-w-[640px] text-left text-sm', className)} {...props} />
    </div>
  );
}
export function TableHeader(props: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500" {...props} />
  );
}
export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-slate-800 bg-slate-950/40" {...props} />;
}
export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('transition-colors hover:bg-slate-900/70', className)} {...props} />;
}
export function TableHead(props: HTMLAttributes<HTMLTableCellElement>) {
  return <th className="px-4 py-3 font-semibold" scope="col" {...props} />;
}
export function TableCell(props: HTMLAttributes<HTMLTableCellElement>) {
  return <td className="px-4 py-4 text-slate-300" {...props} />;
}
