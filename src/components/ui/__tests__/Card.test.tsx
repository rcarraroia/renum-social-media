import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card', () => {
  it('renderiza Card corretamente', () => {
    renderWithProviders(
      <Card data-testid="card">
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('renderiza CardHeader com título', () => {
    renderWithProviders(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renderiza CardDescription', () => {
    renderWithProviders(
      <Card>
        <CardHeader>
          <CardDescription>Test description</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renderiza CardContent', () => {
    renderWithProviders(
      <Card>
        <CardContent>
          <p>Content text</p>
        </CardContent>
      </Card>
    );
    expect(screen.getByText('Content text')).toBeInTheDocument();
  });

  it('renderiza CardFooter', () => {
    renderWithProviders(
      <Card>
        <CardFooter>
          <p>Footer text</p>
        </CardFooter>
      </Card>
    );
    expect(screen.getByText('Footer text')).toBeInTheDocument();
  });

  it('renderiza Card completo', () => {
    renderWithProviders(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
