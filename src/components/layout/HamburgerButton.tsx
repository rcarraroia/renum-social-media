import React from "react";
import { Menu, X } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";

export const HamburgerButton: React.FC = () => {
  const { isOpen, toggle } = useSidebar();

  return (
    <button
      onClick={toggle}
      className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
      aria-label="Toggle menu"
    >
      {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
    </button>
  );
};

export default HamburgerButton;