import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Cria um novo QueryClient para testes
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Wrapper customizado para testes com providers
 */
interface AllTheProvidersProps {
  children: React.ReactNode;
}

export function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Render customizado com providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Mock de usuário autenticado
 */
export const mockAuthUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
};

/**
 * Mock de organização
 */
export const mockOrganization = {
  id: 'test-org-id',
  name: 'Test Organization',
  plan: 'pro',
  created_at: '2024-01-01T00:00:00Z',
};

/**
 * Mock de vídeo
 */
export const mockVideo = {
  id: 'test-video-id',
  title: 'Test Video',
  url: 'https://example.com/video.mp4',
  thumbnail_url: 'https://example.com/thumb.jpg',
  duration: 120,
  status: 'completed',
  organization_id: 'test-org-id',
  user_id: 'test-user-id',
  created_at: '2024-01-01T00:00:00Z',
};

/**
 * Mock de post
 */
export const mockPost = {
  id: 'test-post-id',
  content: 'Test post content',
  platform: 'instagram',
  status: 'draft',
  scheduled_for: null,
  organization_id: 'test-org-id',
  user_id: 'test-user-id',
  created_at: '2024-01-01T00:00:00Z',
};

/**
 * Aguarda por loading states
 */
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Re-export tudo do testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
