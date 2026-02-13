import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { StatCard, ModuleCard, ActivityList } from "@/components/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { showError } from "@/utils/toast";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, activities, loading, error, refresh } = useDashboard();

  useEffect(() => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Dashboard error:", error);
      showError("Erro ao carregar dados do dashboard");
    }
  }, [error]);

  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateString = now.toLocaleDateString();

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bem-vindo, {user?.full_name ?? user?.email ?? "Usuário"}! 👋</h1>
            <p className="text-sm text-slate-500">Hoje: {dateString} • {timeString}</p>
          </div>
          <div>
            <button onClick={() => refresh()} className="px-3 py-1 rounded bg-gray-100 text-sm">Atualizar</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="📹 Vídeos"
            value={loading || !stats ? "—" : stats.videosCount}
            subtitle={loading || !stats ? "" : `Este mês • ${stats.videosGrowth >= 0 ? `↑ ${stats.videosGrowth}%` : `${stats.videosGrowth}%`}`}
            loading={loading}
            icon={<span>🎥</span>}
          />
          <StatCard
            title="📅 Posts"
            value={loading || !stats ? "—" : stats.postsScheduled}
            subtitle={loading || !stats || !stats.nextPost ? "" : `Próximo: ${new Date(stats.nextPost.date).toLocaleString()} • ${stats.nextPost.platform}`}
            loading={loading}
            icon={<span>📣</span>}
          />
          <StatCard
            title="💎 Plano"
            value={loading || !stats ? "—" : stats.plan.toUpperCase()}
            subtitle={loading || !stats ? "" : `${stats.videosQuota.used}/${stats.videosQuota.total} vídeos este mês`}
            loading={loading}
            icon={<span>🏷️</span>}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Seus Módulos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ModuleCard title="📝 ScriptAI" description="Pesquise temas e gere scripts com IA" badge="Novo" disabled />
            <ModuleCard title="⚡ PostRápido" description="Faça upload, adicione legendas e agende posts" badge="Em breve" disabled />
            <ModuleCard title="🤖 AvatarAI" description="Crie vídeos com avatar virtual automaticamente" badge={stats?.plan !== "pro" ? "Plano Pro" : ""} disabled={stats?.plan !== "pro"} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Atividade Recente</h2>
          <ActivityList activities={activities} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;