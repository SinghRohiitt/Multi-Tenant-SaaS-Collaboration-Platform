import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function BrokenView(): never {
  throw new Error('private implementation detail');
}

describe('ErrorBoundary', () => {
  it('renders a safe recovery view when a child throws', () => {
    render(
      <ErrorBoundary>
        <BrokenView />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('private implementation detail')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
