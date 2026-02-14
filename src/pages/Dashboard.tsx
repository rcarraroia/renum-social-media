import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { StatCard, ModuleCard, ActivityList } from "@/components/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { showError } from "@/utils/toast";
import AIAssistantFAB from "@/components/ui/AIAssistantFAB";

type RemoteStats = {
  videosCreated: number;
  postsScheduled: number;
  postsPublished: number;
  engagementTotal: number;
};

const DEFAULT_STATS: RemoteStats = {
  videosCreated: 0,
  postsScheduled: 0,
  postsPublished: 0,
  engagementTotal: 0,
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats: localStats, activities, loading, error, refresh } = useDashboard();
  const [apiStats, setApiStats] = useState<RemoteStats | null>(null);
  const [socials, setSocials] = useState<Record<string, { connected: boolean; accountName?: string | null }>>({});

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const j = await res.json();
          setApiStats({
            videosCreated: j.videosCreated ?? localStats?.videosCount ?? 0,
            postsScheduled: j.postsScheduled ?? localStats?.postsScheduled ?? 0,
            postsPublished: j.postsPublished ?? 0,
            engagementTotal: j.engagementTotal ?? 0,
          });
        } else {
          setApiStats(null);
        }
      } catch (e) {
        setApiStats(null);
      }
    }

    async function loadSocials() {
      try {
        const res = await fetch("/api/integrations/social-accounts");
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, any> = {};
          (data ?? []).forEach((s: any) => {
            map[s.platform] = { connected: !!s.connected, accountName: s.accountName ?? null };
          });
          // ensure keys
          ["linkedin", "x", "instagram", "tiktok", "facebook", "youtube"].forEach((p) => {
            if (!map[p]) map[p] = { connected: false, accountName: null };
          });
          setSocials(map);
        } else {
          setSocials({});
        }
      } catch {
        setSocials({});
      }
    }

    loadStats();
    loadSocials();
    // also refresh activities from hook
  }, [localStats]);

  useEffect(() => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Dashboard error:", error);
      showError("Erro ao carregar dados do dashboard");
    }
  }, [error]);

  const finalStats = apiStats ?? {
    videosCreated: localStats ? localStats.videosCount : DEFAULT_STATS.videosCreated,
    postsScheduled: localStats ? localStats.postsScheduled : DEFAULT_STATS.postsScheduled,
    postsPublished: 0,
    engagementTotal: DEFAULT_STATS.engagementTotal,
  };

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bem-vindo, {user?.full_name ?? user?.email ?? "Usuário"}! 👋</h1>
            <p className="text-sm text-slate-500">Visão geral rápida do seu workspace</p>
          </div>
          <div>
            <button onClick={() => refresh()} className="px-3 py-1 rounded bg-gray-100 text-sm">Atualizar</button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="📹 Vídeos Criados" value={finalStats.videosCreated} subtitle="Todos os módulos" icon={<span>🎥</span>} />
          <StatCard title="📅 Posts Agendados" value={finalStats.postsScheduled} subtitle="Agendados" icon={<span>📣</span>} />
          <StatCard title="✅ Posts Publicados" value={finalStats.postsPublished} subtitle="Publicados" icon={<span>🚀</span>} />
          <StatCard title="📈 Engajamento Total" value={finalStats.engagementTotal} subtitle="Likes • Comments • Shares" icon={<span>📊</span>} />
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Seus Módulos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ModuleCard
              title="📝 ScriptAI"
              description="Pesquise tendências e gere scripts otimizados para vídeo"
              onSelect={() => {
                window.location.href = "/module-1/script-ai";
              }}
            />
            <ModuleCard
              title="⚡ PostRápido"
              description="Edite vídeos com legendas automáticas e agende publicações"
              onSelect={() => {
                window.location.href = "/module-2/post-rapido";
              }}
            />
            <ModuleCard
              title="🤖 AvatarAI"
              description="Crie vídeos com seu avatar digital automaticamente"
              onSelect={() => {
                if ((user?.organization?.plan ?? "free") !== "pro") {
                  // show upgrade modal (simple alert here)
                  alert("Recurso PRO — faça upgrade para acessar AvatarAI");
                  return;
                }
                window.location.href = "/module-3/avatar-ai";
              }}
              badge={(user?.organization?.plan ?? "free") !== "pro" ? "Pro" : ""}
            />
          </div>
        </div>

        {/* Social widget */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-2">Redes conectadas</h3>
          <div className="flex items-center gap-2 overflow-auto">
            {["linkedin", "x", "instagram", "tiktok", "facebook", "youtube"].map((p) => {
              const s = socials[p] ?? { connected: false, accountName: null };
              return (
                <button
                  key={p}
                  onClick={() => {
                    if (!s.connected) {
                      window.location.href = "/settings#integrations";
                    }
                  }}
                  title={s.connected ? (s.accountName ?? p) : "Clique para conectar"}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap border ${s.connected ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-100 text-slate-700 border-slate-200"}`}
                >
                  {p.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Atividade Recente</h2>
          <ActivityList activities={activities} />
        </div>
      </div>

      {/* AI Assistant FAB */}
      <AIAssistantFAB />
    </MainLayout>
  );
};

export default Dashboard;