import { Spinner } from '@/components/ui';

export function RouteLoading() {
  return (
    <div aria-label="Loading page" className="grid min-h-[50vh] place-items-center" role="status">
      <Spinner label="Loading page" />
    </div>
  );
}
