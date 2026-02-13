import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="bg-white rounded-lg shadow p-4 flex-1">
    <div className="text-sm text-slate-500">{title}</div>
    <div className="text-2xl font-semibold mt-2">{value}</div>
  </div>
);

const ModuleCard: React.FC<{ title: string; badge?: string }> = ({ title, badge }) => (
  <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
    <div>
      <div className="font-medium">{title}</div>
      <div className="text-sm text-slate-500">Placeholder</div>
    </div>
    {badge && <div className="text-xs px-2 py-1 rounded bg-gray-100">{badge}</div>}
  </div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString();

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bem-vindo, {user?.full_name ?? user?.email ?? "Usuário"}!</h1>
            <p className="text-sm text-slate-500">Hoje: {today}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Vídeos criados este mês" value={0} />
          <StatCard title="Posts agendados" value={0} />
          <StatCard title="Plano atual" value={"Free"} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModuleCard title="Módulo 1: Pesquisa + Script" badge="Em breve" />
          <ModuleCard title="Módulo 2: Upload + Edição" badge="Em breve" />
          <ModuleCard title="Módulo 3: Avatar AI" badge="Plano Pro" />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;