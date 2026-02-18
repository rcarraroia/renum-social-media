import React from "react";
import { api } from "@/lib/api";
import { showLoading, dismissToast, showError } from "@/utils/toast";
import type { Platform } from "@/lib/compatibility";

type ScheduleMode = "now" | "scheduled" | "ai";

interface Props {
  platforms: Platform[];
  descriptions: Record<string, string>;
  onSchedule: (config: {
    mode: ScheduleMode;
    scheduledAt?: string;
    descriptions: Record<string, string>;
  }) => Promise<any>;
  onBack?: () => void;
}

const ScheduleStep: React.FC<Props> = ({ platforms, descriptions, onSchedule, onBack }) => {
  const [mode, setMode] = React.useState<ScheduleMode>("now");
  const [scheduledDate, setScheduledDate] = React.useState<string>("");
  const [scheduledTime, setScheduledTime] = React.useState<string>("");
  const [aiSuggestion, setAiSuggestion] = React.useState<{
    date: string;
    time: string;
    reason: string;
  } | null>(null);
  const [loadingAi, setLoadingAi] = React.useState(false);
  const [scheduling, setScheduling] = React.useState(false);

  // Carregar sugestão de IA
  const loadAiSuggestion = React.useCallback(async () => {
    if (platforms.length === 0) {
      showError("Selecione pelo menos uma plataforma");
      return;
    }

    setLoadingAi(true);
    const toastId = showLoading("Analisando melhor horário...");

    try {
      // Converter Platform[] para SocialPlatform[] (filtrar apenas plataformas suportadas)
      const supportedPlatforms = platforms.filter(p => 
        ['instagram', 'tiktok', 'linkedin', 'facebook', 'x', 'youtube'].includes(p)
      ) as any[];

      const response = await api.analytics.getBestTimeToPost({
        platforms: supportedPlatforms,
        days: 7,
      });

      dismissToast(toastId);

      if (response.suggestion) {
        const suggestedDate = new Date(response.suggestion.datetime);
        setAiSuggestion({
          date: suggestedDate.toISOString().split("T")[0],
          time: suggestedDate.toTimeString().slice(0, 5),
          reason: response.suggestion.reason ?? "Baseado em analytics de engajamento",
        });
      }
    } catch (err: any) {
      dismissToast(toastId);
      console.error("Erro ao buscar sugestão:", err);
      showError("Erro ao buscar sugestão de horário");
    } finally {
      setLoadingAi(false);
    }
  }, [platforms]);

  // Carregar sugestão automaticamente quando modo AI for selecionado
  React.useEffect(() => {
    if (mode === "ai" && !aiSuggestion && !loadingAi) {
      loadAiSuggestion();
    }
  }, [mode, aiSuggestion, loadingAi, loadAiSuggestion]);

  const handleSchedule = async () => {
    let scheduledAt: string | undefined;

    if (mode === "scheduled") {
      if (!scheduledDate || !scheduledTime) {
        showError("Selecione data e horário");
        return;
      }

      const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (dateTime <= new Date()) {
        showError("Data e horário devem ser no futuro");
        return;
      }

      scheduledAt = dateTime.toISOString();
    } else if (mode === "ai") {
      if (!aiSuggestion) {
        showError("Aguarde a sugestão de IA");
        return;
      }

      scheduledAt = new Date(`${aiSuggestion.date}T${aiSuggestion.time}`).toISOString();
    }

    setScheduling(true);
    await onSchedule({
      mode,
      scheduledAt,
      descriptions,
    });
    setScheduling(false);
  };

  // Obter data/hora mínima (agora + 5 minutos)
  const minDateTime = React.useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return {
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().slice(0, 5),
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Resumo das plataformas */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium mb-2">📱 Plataformas Selecionadas</div>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <span
              key={platform}
              className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm"
            >
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </span>
          ))}
        </div>
      </div>

      {/* Opções de agendamento */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="text-sm font-medium mb-3">⏰ Quando publicar?</div>

        {/* Opção 1: Publicar Agora */}
        <label className="flex items-start gap-3 p-3 rounded border-2 cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="schedule-mode"
            value="now"
            checked={mode === "now"}
            onChange={() => setMode("now")}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="font-medium">🚀 Publicar Agora</div>
            <div className="text-sm text-slate-500 mt-1">
              Os posts serão publicados imediatamente em todas as plataformas
            </div>
          </div>
        </label>

        {/* Opção 2: Agendar Data/Hora */}
        <label className="flex items-start gap-3 p-3 rounded border-2 cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="schedule-mode"
            value="scheduled"
            checked={mode === "scheduled"}
            onChange={() => setMode("scheduled")}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="font-medium">📅 Agendar Data e Horário</div>
            <div className="text-sm text-slate-500 mt-1 mb-3">
              Escolha quando os posts serão publicados
            </div>

            {mode === "scheduled" && (
              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-600 block mb-1">Data</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={minDateTime.date}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-600 block mb-1">Horário</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </label>

        {/* Opção 3: Sugestão de IA */}
        <label className="flex items-start gap-3 p-3 rounded border-2 cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="schedule-mode"
            value="ai"
            checked={mode === "ai"}
            onChange={() => setMode("ai")}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="font-medium">🤖 Usar Sugestão de IA</div>
            <div className="text-sm text-slate-500 mt-1 mb-3">
              Baseado em analytics de engajamento das suas redes
            </div>

            {mode === "ai" && (
              <div className="mt-3">
                {loadingAi && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="animate-spin">⏳</div>
                    Analisando melhor horário...
                  </div>
                )}

                {!loadingAi && aiSuggestion && (
                  <div className="bg-indigo-50 rounded p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✨</span>
                      <div>
                        <div className="font-medium text-indigo-900">
                          {new Date(`${aiSuggestion.date}T${aiSuggestion.time}`).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                          {" às "}
                          {aiSuggestion.time}
                        </div>
                        <div className="text-sm text-indigo-700 mt-1">
                          {aiSuggestion.reason}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={loadAiSuggestion}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      🔄 Buscar outro horário
                    </button>
                  </div>
                )}

                {!loadingAi && !aiSuggestion && (
                  <button
                    onClick={loadAiSuggestion}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Carregar sugestão
                  </button>
                )}
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Ações */}
      <div className="flex justify-between">
        <div>
          {onBack && (
            <button onClick={onBack} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">
              ← Voltar
            </button>
          )}
        </div>
        <div>
          <button
            onClick={handleSchedule}
            disabled={scheduling || (mode === "ai" && !aiSuggestion)}
            className="px-6 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {scheduling ? "Agendando..." : mode === "now" ? "🚀 Publicar Agora" : "📅 Agendar Posts"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleStep;
