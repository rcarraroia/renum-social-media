import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import HamburgerButton from "./HamburgerButton";
import { useCloseSidebarOnNavigate } from "@/hooks/useCloseSidebarOnNavigate";

type Props = {
  children: React.ReactNode;
};

const MainLayout: React.FC<Props> = ({ children }) => {
  // closes sidebar automatically when navigation occurs
  useCloseSidebarOnNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Mobile hamburger */}
      <HamburgerButton />

      {/* Sidebar (drawer on mobile, static on desktop) */}
      <Sidebar />

      {/* Main content - on desktop leave space for sidebar width (w-64) */}
      <div className="md:pl-64">
        <main className="max-w-6xl mx-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;