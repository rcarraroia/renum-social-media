import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/utils';
import { ErrorBoundary } from '../ErrorBoundary';

// Componente que lança erro para testar
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suprimir console.error durante testes
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renderiza children quando não há erro', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renderiza UI de erro quando há erro', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('exibe mensagem de erro', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
  });

  it('tem botão para tentar novamente', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
