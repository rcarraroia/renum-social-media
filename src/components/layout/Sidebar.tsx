import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar: React.FC = () => {
  const LinkItem: React.FC<{ to: string; children: React.ReactNode; badge?: React.ReactNode }> = ({ to, children, badge }) => {
    return (
      <NavLink
        to={to}
        end={false}
        className={({ isActive }) =>
          `block px-3 py-2 rounded-md ${isActive ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100"}`
        }
      >
        <div className="flex items-center justify-between">
          <div>{children}</div>
          {badge ? <div className="ml-2">{badge}</div> : null}
        </div>
      </NavLink>
    );
  };

  return (
    <aside className="w-64 bg-white border-r min-h-[calc(100vh-64px)] p-4">
      <nav className="space-y-2">
        <LinkItem to="/dashboard">Dashboard</LinkItem>

        <LinkItem to="/module-1/script-ai" badge={<span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-sm">Novo</span>}>
          <span className="inline-flex items-center gap-2">
            <span>📝</span>
            <span>ScriptAI</span>
          </span>
        </LinkItem>

        <LinkItem to="/module-2/post-rapido" badge={<span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-sm">Em breve</span>}>
          <span className="inline-flex items-center gap-2">
            <span>⚡</span>
            <span>PostRápido</span>
          </span>
        </LinkItem>

        <LinkItem to="/module-3/avatar-ai" badge={<span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-sm">Plano Pro</span>}>
          <span className="inline-flex items-center gap-2">
            <span>🤖</span>
            <span>AvatarAI</span>
          </span>
        </LinkItem>

        <LinkItem to="/calendar">📅 Calendário</LinkItem>
        <LinkItem to="/analytics">📊 Analytics</LinkItem>
        <LinkItem to="/settings">Settings</LinkItem>
      </nav>

      {/* The duplicate "Módulos" block has been intentionally removed; badges are shown next to menu items above */}
    </aside>
  );
};

export default Sidebar;