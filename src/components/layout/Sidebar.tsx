import React from "react";
import { NavLink } from "react-router-dom";
import { useSidebar } from "@/hooks/useSidebar";

const LinkItem: React.FC<{ to: string; children: React.ReactNode; badge?: React.ReactNode }> = ({ to, children, badge }) => {
  return (
    <NavLink
      to={to}
      end={false}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-md transition-colors min-h-[44px] flex items-center ${isActive ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100"}`
      }
    >
      <div className="flex items-center justify-between w-full">
        <div>{children}</div>
        {badge ? <div className="ml-2">{badge}</div> : null}
      </div>
    </NavLink>
  );
};

const Sidebar: React.FC = () => {
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed top-16 left-0 bottom-0 bg-white z-40 transition-transform duration-300 ease-in-out w-64 overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        ].join(" ")}
      >
        <nav className="p-4">
          {/* Logo section - only show on mobile when sidebar is open */}
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">R</div>
            <div>
              <div className="font-semibold text-slate-800">RENUM Social AI</div>
              <div className="text-xs text-slate-500">Automatize seus vídeos com IA</div>
            </div>
          </div>

          <div className="space-y-2">
            <LinkItem to="/dashboard">Dashboard</LinkItem>

            <LinkItem to="/module-1/script-ai" badge={<span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">Novo</span>}>
              <span className="inline-flex items-center gap-2">
                <span>📝</span>
                <span>ScriptAI</span>
              </span>
            </LinkItem>

            <LinkItem to="/module-2/post-rapido" badge={<span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">Em breve</span>}>
              <span className="inline-flex items-center gap-2">
                <span>⚡</span>
                <span>PostRápido</span>
              </span>
            </LinkItem>

            <LinkItem to="/module-3/avatar-ai" badge={<span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">Plano Pro</span>}>
              <span className="inline-flex items-center gap-2">
                <span>🤖</span>
                <span>AvatarAI</span>
              </span>
            </LinkItem>

            <LinkItem to="/calendar">
              <span className="inline-flex items-center gap-2">
                <span>📅</span>
                <span>Calendário</span>
              </span>
            </LinkItem>

            <LinkItem to="/analytics">
              <span className="inline-flex items-center gap-2">
                <span>📊</span>
                <span>Analytics</span>
              </span>
            </LinkItem>

            <LinkItem to="/settings">Settings</LinkItem>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 text-xs text-slate-500">
            <div>© RENUM</div>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;