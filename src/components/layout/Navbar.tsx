import React from "react";
import { useAuth } from "@/hooks/useAuth";

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50">
      <div className="h-full max-w-full mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">R</div>
          <div>
            <div className="font-semibold text-slate-800">RENUM Social AI</div>
            <div className="text-xs text-slate-500">Automatize seus vídeos com IA</div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-600 hidden sm:block">Olá, {user?.full_name ?? user?.email ?? "Usuário"}</div>
          <button onClick={() => signOut()} className="px-3 py-1 rounded-md bg-indigo-600 text-white text-sm min-h-[44px]">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;