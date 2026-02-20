import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { analytics } from "@/services/analytics";

export const usePageTracking = () => {
  const location = useLocation();
  const previousPath = useRef<string>("");

  useEffect(() => {
    // Only track if path changed
    if (location.pathname !== previousPath.current) {
      previousPath.current = location.pathname;

      // Track page view
      analytics.trackPageView(getPageName(location.pathname));

      // Track performance metrics
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

        if (loadTime > 0) {
          analytics.trackPerformance("page_load_time", loadTime, {
            path: location.pathname,
          });
        }

        if (domReady > 0) {
          analytics.trackPerformance("dom_ready_time", domReady, {
            path: location.pathname,
          });
        }
      }
    }
  }, [location.pathname]);
};

function getPageName(pathname: string): string {
  const routes: Record<string, string> = {
    "/": "Landing Page",
    "/login": "Login",
    "/register": "Registro",
    "/dashboard": "Dashboard",
    "/module-1/script-ai": "ScriptAI",
    "/module-1/teleprompter": "Teleprompter",
    "/module-2/post-rapido": "PostRápido",
    "/module-3/avatar-ai": "AvatarAI",
    "/calendar": "Calendário",
    "/analytics": "Analytics",
    "/settings": "Configurações",
    "/my-videos": "Meus Vídeos",
  };

  return routes[pathname] || pathname;
}
