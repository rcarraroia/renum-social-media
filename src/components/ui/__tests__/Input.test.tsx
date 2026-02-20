import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/utils';
import { Input } from '../input';

describe('Input', () => {
  it('renderiza corretamente', () => {
    renderWithProviders(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('aceita input do usuário', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    await user.type(input, 'Hello World');
    
    expect(input).toHaveValue('Hello World');
  });

  it('chama onChange quando valor muda', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    renderWithProviders(<Input onChange={handleChange} />);
    
    await user.type(screen.getByRole('textbox'), 'test');
    expect(handleChange).toHaveBeenCalled();
  });

  it('está desabilitado quando disabled=true', () => {
    renderWithProviders(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('aplica type corretamente', () => {
    renderWithProviders(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('aplica className customizado', () => {
    renderWithProviders(<Input className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });
});
