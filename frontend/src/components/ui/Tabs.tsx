import { createContext, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

type TabsContextValue = { value: string; setValue: (value: string) => void };
const TabsContext = createContext<TabsContextValue | null>(null);

type TabsProps = { defaultValue: string; children: ReactNode; className?: string };
export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}
export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-1 border-b border-slate-800', className)} role="tablist">
      {children}
    </div>
  );
}
export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used inside Tabs');
  const active = context.value === value;
  return (
    <button
      aria-selected={active}
      className={cn(
        'border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300',
        active
          ? 'border-cyan-400 text-cyan-300'
          : 'border-transparent text-slate-500 hover:text-slate-200',
      )}
      onClick={() => context.setValue(value)}
      role="tab"
      type="button"
    >
      {children}
    </button>
  );
}
export function TabsContent({ value, children }: { value: string; children: ReactNode }) {
  const context = useContext(TabsContext);
  if (!context || context.value !== value) return null;
  return (
    <div className="pt-5" role="tabpanel">
      {children}
    </div>
  );
}
