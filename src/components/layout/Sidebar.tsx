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
        <NavLink to="/modules/2">Módulo 2</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>

      <div className="mt-6 text-sm text-slate-500">
        <div className="font-medium">Módulos</div>
        <ul className="mt-2">
          <li className="mt-1">Pesquisa + Script <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-xs">Em breve</span></li>
          <li className="mt-1">Upload + Edição <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-xs">Em breve</span></li>
          <li className="mt-1">Avatar AI <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-xs">Plano Pro</span></li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;