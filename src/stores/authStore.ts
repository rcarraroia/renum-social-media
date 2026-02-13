import create from "zustand";
import type { UsersRow } from "@/types/database.types";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/services/auth";

type AuthState = {
  user: (UsersRow & { id: string; email: string }) | null;
  loading: boolean;
  initialized: boolean;
  setUser: (u: AuthState["user"]) => void;
  setLoading: (v: boolean) => void;
  clearUser: () => void;
  initialize: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  setUser: (u) => set({ user: u }),
  setLoading: (v) => set({ loading: v }),
  clearUser: () => set({ user: null }),
  initialize: async () => {
    set({ loading: true });
    try {
      // If there's an existing session, keep user signed
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const user = await getCurrentUser();
        set({ user: user as any, initialized: true });
      } else {
        set({ user: null, initialized: true });
      }
    } finally {
      set({ loading: false });
    }
  },
}));