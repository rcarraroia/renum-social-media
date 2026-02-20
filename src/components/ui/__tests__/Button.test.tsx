import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/utils';
import { Button } from '../button';

describe('Button', () => {
  it('renderiza corretamente', () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('chama onClick quando clicado', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('está desabilitado quando disabled=true', () => {
    renderWithProviders(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('não chama onClick quando desabilitado', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    renderWithProviders(<Button disabled onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('aplica variant default corretamente', () => {
    renderWithProviders(<Button variant="default">Default</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('aplica variant destructive corretamente', () => {
    renderWithProviders(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('aplica size sm corretamente', () => {
    renderWithProviders(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-9');
  });

  it('aplica size lg corretamente', () => {
    renderWithProviders(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-11');
  });
});
