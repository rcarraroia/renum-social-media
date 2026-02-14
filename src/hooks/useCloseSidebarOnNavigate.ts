import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSidebar } from "./useSidebar";

export const useCloseSidebarOnNavigate = () => {
  const location = useLocation();
  const close = useSidebar((s) => s.close);

  useEffect(() => {
    // close sidebar on every navigation change
    close();
  }, [location.pathname, close]);
};