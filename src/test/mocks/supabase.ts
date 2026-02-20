import { vi } from 'vitest';

/**
 * Mock do cliente Supabase
 */
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({
      error: null,
    }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    execute: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      download: vi.fn().mockResolvedValue({ data: null, error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/file.jpg' },
      }),
    }),
  },
};

/**
 * Mock do hook useSupabase
 */
export const mockUseSupabase = () => mockSupabaseClient;
