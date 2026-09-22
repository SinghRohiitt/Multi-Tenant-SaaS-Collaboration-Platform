import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

type ErrorBoundaryProps = PropsWithChildren;
type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('Unhandled frontend error', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center text-slate-100">
        <div className="max-w-md space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-rose-300">
            Unexpected error
          </p>
          <h1 className="text-3xl font-semibold">Something went wrong</h1>
          <p className="text-sm leading-6 text-slate-400">
            The application could not render this view. You can try again without exposing technical
            details.
          </p>
          <Button onClick={this.handleRetry}>
            <RefreshCw aria-hidden="true" className="size-4" /> Try again
          </Button>
        </div>
      </main>
    );
  }
}
