import { createRoot } from "react-dom/client";
import App from "./App";
import "./globals.css";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";

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

// Register service worker (if available)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((err) => {
        // registration failed
        // console.warn("Service worker registration failed:", err);
      });
  });
}