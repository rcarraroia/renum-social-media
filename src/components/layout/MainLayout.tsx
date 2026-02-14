import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import HamburgerButton from "./HamburgerButton";
import { useCloseSidebarOnNavigate } from "@/hooks/useCloseSidebarOnNavigate";
import { AIAssistantProvider, AIAssistantChat } from "@/components/ai";

type Props = {
  children: React.ReactNode;
};

const MainLayout: React.FC<Props> = ({ children }) => {
  // closes sidebar automatically when navigation occurs
  useCloseSidebarOnNavigate();

  return (
    <AIAssistantProvider>
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        {/* Mobile hamburger */}
        <HamburgerButton />

        {/* Sidebar (drawer on mobile, static on desktop) */}
        <Sidebar />

        {/* Main content - add top padding equal to navbar height (h-16) to avoid overlap */}
        <div className="md:pl-64 pt-16">
          <main className="max-w-6xl mx-auto p-4 md:p-6">
            {children}
          </main>
        </div>

        {/* AI Assistant Chat (global) */}
        <AIAssistantChat />
      </div>
    </AIAssistantProvider>
  );
};

export default MainLayout;