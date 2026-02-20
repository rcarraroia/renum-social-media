import { createRoot } from "react-dom/client";
import App from "./App";
import "./globals.css";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { registerServiceWorker } from "@/utils/registerServiceWorker";

// Initialize supabase listener to react to auth changes
function SupabaseAuthListener() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      // when auth changes, re-initialize store
      useAuthStore.getState().initialize();
    });

    // initial init
    useAuthStore.getState().initialize();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  return null;
}

createRoot(document.getElementById("root")!).render(
  <>
    <SupabaseAuthListener />
    <App />
  </>,
);

// Register service worker for PWA and offline support
registerServiceWorker();