import React from "react";
import { Link, useLocation } from "react-router-dom";

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link to={to} className={`block px-3 py-2 rounded-md ${active ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
      {children}
    </Link>
  );
};

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r min-h-[calc(100vh-64px)] p-4">
      <nav className="space-y-2">
        <NavLink to="/dashboard">Dashboard</NavLink>

        <NavLink to="/module-1/script-ai">
          <span className="inline-flex items-center gap-2">
            <span>📝</span>
            <span>ScriptAI</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-sm">Novo</span>
          </span>
        </NavLink>

        <NavLink to="/module-2/post-rapido">
          <span className="inline-flex items-center gap-2">
            <span>⚡</span>
            <span>PostRápido</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-sm">Em breve</span>
          </span>
        </NavLink>

        <NavLink to="/module-3/avatar-ai">
          <span className="inline-flex items-center gap-2">
            <span>🤖</span>
            <span>AvatarAI</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-sm">Plano Pro</span>
          </span>
        </NavLink>

        <NavLink to="/calendar">📅 Calendário</NavLink>
        <NavLink to="/analytics">📊 Analytics</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>

      {/* The duplicate "Módulos" block has been intentionally removed; badges are shown next to menu items above */}
    </aside>
  );
};

export default Sidebar;