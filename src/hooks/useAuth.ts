import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import * as authService from "@/services/auth";
import { showSuccess, showError } from "@/utils/toast";
import { hasCompletedOnboarding } from "@/utils/onboarding";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const clearUser = useAuthStore((s) => s.clearUser);
  const initialize = useAuthStore((s) => s.initialize);

  const navigate = useNavigate();

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      setLoading(true);
      try {
        const res = await authService.signUp(email, password, fullName);
        if (res.error) {
          showError(res.error.message ?? "Erro ao criar conta");
          return { error: res.error };
        }
        showSuccess("Conta criada! Redirecionando...");
        // initialization will pick up created user + organization via trigger
        await initialize();

        // After creating account, detect onboarding
        const currentUser = useAuthStore.getState().user;
        const orgId = currentUser?.organization_id;
        const completed = await hasCompletedOnboarding(currentUser?.id, orgId);
        if (!completed) {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }

        return { data: res.data };
      } finally {
        setLoading(false);
      }
    },
    [navigate, setLoading, initialize],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const res = await authService.signIn(email, password);
        if (res.error) {
          showError(res.error.message ?? "Erro ao entrar");
          return { error: res.error };
        }
        // Fetch latest profile
        await initialize();

        // After login, decide onboarding or dashboard
        const currentUser = useAuthStore.getState().user;
        const orgId = currentUser?.organization_id;
        const completed = await hasCompletedOnboarding(currentUser?.id, orgId);
        if (!completed) {
          navigate("/onboarding");
        } else {
          showSuccess("Login bem-sucedido");
          navigate("/dashboard");
        }
        return { data: res.data };
      } finally {
        setLoading(false);
      }
    },
    [navigate, setLoading, initialize],
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await authService.signOut();
      clearUser();
      showSuccess("Desconectado");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [clearUser, navigate, setLoading]);

  return {
    user,
    loading,
    initialized: useAuthStore((s) => s.initialized),
    signIn,
    signUp,
    signOut,
    initialize,
  };
}