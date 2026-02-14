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
  useCloseSidebarOnNavigate();

  return (
    <AIAssistantProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Fixed Navbar */}
        <Navbar />

        {/* Mobile hamburger button */}
        <HamburgerButton />

        {/* Sidebar - fixed on mobile, static on desktop */}
        <Sidebar />

        {/* Main content area - offset by sidebar on desktop, offset by navbar on all screens */}
        <div className="pt-16 md:pl-64">
          <main className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
            {children}
          </main>
        </div>

        <AIAssistantChat />
      </div>
    </AIAssistantProvider>
  );
};

export default MainLayout;