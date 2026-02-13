import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import AvatarGallery from "@/components/modules/AvatarGallery";
import VoiceSelector from "@/components/modules/VoiceSelector";
import CreditsBadge from "@/components/modules/CreditsBadge";
import { useAvatar } from "@/hooks/useAvatar";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { showError, showSuccess } from "@/utils/toast";

const UpgradeRequired: React.FC<{ onUpgrade: () => void; onRefresh: () => void; onBack: () => void }> = ({ onUpgrade, onRefresh, onBack }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-xl bg-white rounded-lg shadow p-6 text-center">
        <div className="text-3xl">⭐ Recurso Premium</div>
        <p className="mt-3 text-slate-600">Geração de vídeos com Avatar AI é exclusivo do Plano Pro.</p>
        <div className="mt-6">
          <div className="text-left border rounded p-4">
            <div className="font-medium">💎 PLANO PRO — R$ 99/mês</div>
            <ul className="text-sm text-slate-600 mt-2 list-disc pl-5">
              <li>30 vídeos com avatar por mês</li>
              <li>Todos os módulos liberados</li>
              <li>Analytics avançado</li>
              <li>Suporte prioritário</li>
            </ul>
          </div>

          <div className="mt-4 flex gap-2 justify-center">
            <button onClick={onUpgrade} className="px-4 py-2 bg-indigo-600 text-white rounded">Fazer Upgrade Agora →</button>
            <button onClick={onRefresh} className="px-4 py-2 bg-gray-100 rounded">Atualizar Plano</button>
            <button onClick={onBack} className="px-4 py-2 bg-white border rounded">Voltar ao Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Module3Page: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organization_id;
  const [orgPlan, setOrgPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<boolean>(true);

  const params = new URLSearchParams(location.search);
  const initialVideoId = params.get("video_id") ?? null;

  const {
    step,
    setStep,
    videoId,
    setVideoId,
    script,
    setScript,
    selectedAvatar,
    setSelectedAvatar,
    selectedVoice,
    setSelectedVoice,
    credits,
    remainingCredits,
    status,
    progress,
    videoUrl,
    generateVideo,
  } = useAvatar(initialVideoId);

  useEffect(() => {
    let mounted = true;
    async function loadPlan() {
      setLoadingPlan(true);
      try {
        if (!orgId) {
          setOrgPlan(null);
          setLoadingPlan(false);
          return;
        }
        const res: any = await supabase.from("organizations").select("plan,heygen_credits_used,heygen_credits_total").eq("id", orgId).single();
        if (!res.error && res.data) {
          if (mounted) setOrgPlan(res.data.plan ?? "free");
        } else {
          if (mounted) setOrgPlan("free");
        }
      } catch (e) {
        if (mounted) setOrgPlan("free");
      } finally {
        if (mounted) setLoadingPlan(false);
      }
    }
    loadPlan();
    return () => {
      mounted = false;
    };
  }, [orgId]);

  // Allow dev preview or explicit query param for inspection:
  const devOverride = import.meta.env.DEV === true;
  const previewParam = params.get("preview") === "1";

  const allowAccess = devOverride || previewParam || orgPlan === "pro";

  const handleUpgrade = () => {
    navigate("/settings?tab=plan");
  };

  const handleRefreshPlan = () => {
    // simple reload to refetch plan
    window.location.reload();
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  if (loadingPlan) {
    return (
      <MainLayout>
        <div className="p-6 text-center">Carregando...</div>
      </MainLayout>
    );
  }

  if (!allowAccess) {
    return <UpgradeRequired onUpgrade={handleUpgrade} onRefresh={handleRefreshPlan} onBack={handleBack} />;
  }

  // Word count helper
  const countWords = (t: string) => (t ? t.trim().split(/\s+/).length : 0);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => navigate(-1)} className="text-sm text-slate-500 underline">← Voltar</button>
            <h1 className="text-2xl font-bold mt-2">🤖 AvatarAI</h1>
            <p className="text-sm text-slate-500">Vídeos com avatar virtual</p>
          </div>
          <div className="flex items-center gap-3">
            <CreditsBadge used={credits.used} total={credits.total} onClick={() => alert(`Créditos: ${credits.total - credits.used}/${credits.total}`)} />
          </div>
        </div>

        {/* Stepper */}
        <div className="flex gap-2 items-center">
          <div className={`px-3 py-1 rounded ${step === 1 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>1. Script</div>
          <div className={`px-3 py-1 rounded ${step === 2 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>2. Avatar</div>
          <div className={`px-3 py-1 rounded ${step === 3 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>3. Voz</div>
          <div className={`px-3 py-1 rounded ${step === 4 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>4. Gerar</div>
          <div className={`px-3 py-1 rounded ${step === 5 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>5. Preview</div>
        </div>

        {/* Content */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">PASSO 1: Revisar / Editar Script</h3>
                  <p className="text-sm text-slate-500">O avatar falará exatamente este texto — remova emojis/links antes de gerar.</p>
                </div>
                <div className="text-sm text-slate-400">{countWords(script)} palavras</div>
              </div>

              <div className="mt-4">
                <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={8} className="w-full rounded border p-2" />
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-xs text-slate-500">Min: 50 palavras • Max: 500 palavras</div>
                  <div>
                    <button onClick={() => navigate("/module-1/script-ai")} className="px-3 py-1 rounded bg-gray-100 mr-2">🔍 Criar Novo Script</button>
                    <button onClick={() => setStep(2)} className="px-3 py-1 rounded bg-indigo-600 text-white">Próximo: Escolher Avatar →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <AvatarGallery selected={selectedAvatar ?? undefined} onSelect={(a) => setSelectedAvatar(a)} />
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-3 py-1 rounded bg-gray-100">← Voltar</button>
              <button onClick={() => setStep(3)} className="px-3 py-1 rounded bg-indigo-600 text-white">Próximo: Escolher Voz →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <VoiceSelector selected={selectedVoice ?? undefined} onSelect={(v) => setSelectedVoice(v)} />
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-3 py-1 rounded bg-gray-100">← Voltar</button>
              <button onClick={() => setStep(4)} className="px-3 py-1 rounded bg-indigo-600 text-white">Próximo: Gerar Vídeo →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h3 className="text-lg font-semibold">PASSO 4: Confirmar e Gerar Vídeo</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded">
                <div className="text-sm text-slate-500">Script</div>
                <div className="mt-2 text-sm text-slate-700 max-h-36 overflow-auto whitespace-pre-wrap">{script}</div>
                <div className="text-xs text-slate-400 mt-2">{countWords(script)} palavras</div>
              </div>

              <div className="p-3 border rounded">
                <div className="text-sm text-slate-500">Avatar</div>
                <div className="mt-2">{selectedAvatar ? <div className="font-medium">{selectedAvatar.name}</div> : "Nenhum selecionado"}</div>
              </div>

              <div className="p-3 border rounded">
                <div className="text-sm text-slate-500">Voz</div>
                <div className="mt-2">{selectedVoice ? <div className="font-medium">{selectedVoice.name}</div> : "Nenhuma selecionada"}</div>
                <div className="text-xs text-slate-400 mt-2">{remainingCredits} créditos restantes</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setStep(3)} className="px-3 py-1 rounded bg-gray-100">← Voltar</button>
              <div className="flex items-center gap-3">
                <button onClick={() => generateVideo()} className="px-4 py-2 rounded bg-indigo-600 text-white">🎬 Gerar Vídeo com Avatar</button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && status === "generating" && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-slate-600">🎬 Gerando seu vídeo...</div>
            <div className="mt-4">
              <div className="w-full bg-slate-100 h-3 rounded overflow-hidden">
                <div className="h-3 bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 text-xs text-slate-500">Progresso: {progress}%</div>
            </div>
            <div className="mt-3 text-sm text-slate-500">Você pode fechar esta página — enviaremos notificação quando pronto.</div>
          </div>
        )}

        {step === 5 && videoUrl && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold">PASSO 5: Preview do Vídeo Gerado</h3>
              <div className="mt-4">
                <video src={videoUrl} controls className="w-full rounded" />
                <div className="mt-3 text-sm text-slate-500">Duração estimada: 00:45 • Legendas: Incluídas</div>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={() => navigate(`/module-2/post-rapido`)} className="px-3 py-1 rounded bg-gray-100">Editar Descrições</button>
                <button onClick={() => {
                  showSuccess("✅ Vídeo salvo e pronto para agendamento (mock)");
                  navigate("/dashboard");
                }} className="px-3 py-1 rounded bg-indigo-600 text-white">Salvar e Ir para Dashboard</button>
                <button onClick={() => { setStep(4); setVideoId(videoId); }} className="px-3 py-1 rounded bg-white border">Regerar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Module3Page;