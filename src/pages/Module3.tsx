import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import CreditsBadge from "@/components/modules/CreditsBadge";
import { useAvatar } from "@/hooks/useAvatar";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";

const UpgradeRequired: React.FC<{ onUpgrade: () => void; onRefresh: () => void; onBack: () => void }> = ({ onUpgrade, onRefresh, onBack }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-xl bg-white rounded-lg shadow p-6 text-center">
        <div className="text-3xl">🔒 Recurso Pro</div>
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

const HeyGenSetup: React.FC<{ onConfigure: () => void }> = ({ onConfigure }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg bg-white rounded-lg shadow p-6 text-center">
        <div className="text-3xl">⚙️ Configurar HeyGen</div>
        <p className="mt-3 text-slate-600">Para gerar vídeos com avatar, conecte sua conta HeyGen em Configurações.</p>
        <div className="mt-6">
          <button onClick={onConfigure} className="px-4 py-2 bg-indigo-600 text-white rounded">Ir para Configurações →</button>
          <div className="mt-3">
            <button onClick={() => alert("HeyGenSetupWizard (placeholder)")} className="text-sm text-indigo-600 underline">Como criar meu avatar?</button>
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

  const {
    state,
    checking,
    blocked_plan,
    blocked_heygen,
    input,
    approval,
    generating,
    ready,
    failed,
    no_credits,
    script,
    setScript,
    theme,
    setTheme,
    audience,
    setAudience,
    estimatedSeconds,
    credits,
    heygenConfig,
    plan,
    videoUrl,
    progressStep,
    error,
    loading,
    loadScriptFromState,
    generateVideo,
    cancelGeneration,
    reset,
  } = useAvatar();

  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    // If the route passed script via state, load it into hook
    const sstate: any = (location && (location.state as any)) || null;
    if (sstate?.script) {
      loadScriptFromState(sstate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = () => {
    navigate("/settings?tab=plan");
  };

  const handleConfigureHeygen = () => {
    navigate("/settings");
  };

  const handleGenerate = async () => {
    // check credits
    const remaining = Math.max(0, (credits.total ?? 0) - (credits.used ?? 0));
    if ((credits.total ?? 0) > 0 && remaining <= 0) {
      showError("Sem créditos HeyGen. Recarregue sua conta no HeyGen.");
      return;
    }

    setLocalLoading(true);
    const toastId = showLoading("Iniciando geração...");
    const res = await generateVideo();
    dismissToast(toastId);
    setLocalLoading(false);

    if ((res as any)?.error) {
      showError("Erro ao gerar vídeo");
    } else {
      showSuccess("Geração iniciada");
    }
  };

  const handleSendToPostRapido = () => {
    if (!videoUrl) return;
    navigate("/module-2/post-rapido", {
      state: { videoUrl, scriptId: null, source: "heygen" },
    });
  };

  if (checking || loading) {
    return (
      <MainLayout>
        <div className="p-6 text-center">Carregando...</div>
      </MainLayout>
    );
  }

  if (blocked_plan) {
    return (
      <MainLayout>
        <UpgradeRequired onUpgrade={handleUpgrade} onRefresh={() => window.location.reload()} onBack={() => navigate("/dashboard")} />
      </MainLayout>
    );
  }

  if (blocked_heygen) {
    return (
      <MainLayout>
        <HeyGenSetup onConfigure={handleConfigureHeygen} />
      </MainLayout>
    );
  }

  // Now user has Pro and HeyGen configured; render flow
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => navigate(-1)} className="text-sm text-slate-500 underline">← Voltar</button>
            <h1 className="text-2xl font-bold mt-2">🤖 AvatarAI — HeyGen (Self-service)</h1>
            <p className="text-sm text-slate-500">Use suas credenciais HeyGen para gerar vídeos com seu avatar digital.</p>
          </div>
          <div className="flex items-center gap-3">
            <CreditsBadge used={credits.used ?? 0} total={credits.total ?? 0} onClick={() => alert(`Créditos: ${(credits.total ?? 0) - (credits.used ?? 0)}/${credits.total ?? 0}`)} />
          </div>
        </div>

        {/* Stepper simplified: show textual step based on state */}
        <div className="flex gap-2 items-center">
          <div className={`px-3 py-1 rounded ${input ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>1. Script</div>
          <div className={`px-3 py-1 rounded ${approval ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>2. Aprovação</div>
          <div className={`px-3 py-1 rounded ${generating ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>3. Geração</div>
          <div className={`px-3 py-1 rounded ${ready ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>4. Resultado</div>
        </div>

        {/* Content depending on state */}
        {input && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold">PASSO 1: Gerar script para avatar</h3>
            <p className="text-sm text-slate-500">Insira um tema ou traga um script do ScriptAI.</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Tema</label>
                <input value={theme} onChange={(e) => setTheme(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="Ex: Dica rápida para cuidados com a pele" />
              </div>

              <div>
                <label className="block text-sm">Público</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)} className="mt-1 w-full rounded border p-2">
                  <option value="mlm">Vendas Diretas (MLM)</option>
                  <option value="politics">Política</option>
                  <option value="marketing">Marketing Geral</option>
                  <option value="other">Outro</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => navigate("/dashboard")} className="px-3 py-1 rounded bg-gray-100">Cancelar</button>
              <button onClick={async () => {
                // Simple mock generation of script if no script present
                if (!theme.trim()) {
                  showError("Tema não pode estar vazio");
                  return;
                }
                const toastId = showLoading("Gerando script...");
                setTimeout(() => {
                  dismissToast(toastId);
                  const gen = `Script gerado para tema: ${theme}\n\n(versão mock)`;
                  setScript(gen);
                  showSuccess("Script gerado (mock)");
                }, 900);
              }} className="px-4 py-2 rounded bg-indigo-600 text-white">Gerar Script para Avatar →</button>
            </div>
          </div>
        )}

        {approval && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">PASSO 2: Revisar script</h3>
                <p className="text-sm text-slate-500 mt-1">Este script será lido pelo seu avatar digital. Frases curtas funcionam melhor.</p>
              </div>

              <div className="text-sm text-slate-400">
                <div>Palavras: {script ? script.trim().split(/\s+/).length : 0}</div>
                <div>Duração (est): {estimatedSeconds ?? Math.round((script?.split(/\s+/).length ?? 0) * 0.5)}s</div>
                <div className="mt-2">Créditos restantes: {(credits.total ?? 0) - (credits.used ?? 0)}/{credits.total ?? "—"}</div>
              </div>
            </div>

            <div className="mt-4">
              <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={8} className="w-full rounded border p-2" />
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-slate-500">Dica: remova emojis e links para melhor desempenho.</div>
              <div className="flex gap-2">
                <button onClick={() => {
                  // regenerate mock
                  const toastId = showLoading("Regenerating...");
                  setTimeout(() => {
                    dismissToast(toastId);
                    setScript((s) => (s ?? "") + "\n\n(versão regenerada)");
                    showSuccess("Script regenerado (mock)");
                  }, 1000);
                }} className="px-3 py-2 rounded bg-gray-100">🔄 Regerar</button>

                <button onClick={() => setScript((s) => s)} className="px-3 py-2 rounded bg-gray-100">✏️ Editar</button>

                <button
                  onClick={() => {
                    const remaining = Math.max(0, (credits.total ?? 0) - (credits.used ?? 0));
                    if ((credits.total ?? 0) > 0 && remaining <= 0) {
                      showError("Sem créditos HeyGen. Recarregue sua conta no HeyGen.");
                      return;
                    }
                    // move to generation
                    handleGenerate();
                  }}
                  disabled={(credits.total ?? 0) > 0 && Math.max(0, (credits.total ?? 0) - (credits.used ?? 0)) <= 0}
                  className="px-4 py-2 rounded bg-green-600 text-white"
                >
                  {localStorage.getItem("renum_mock_disable_generate") ? "Gerar (desativado em dev)" : "✅ Aprovar e Gerar Vídeo"}
                </button>
              </div>
            </div>
          </div>
        )}

        {generating && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold">PASSO 3: Gerando seu vídeo...</h3>
            <p className="text-sm text-slate-500 mt-1">Geralmente leva 1-3 minutos. Você será notificado quando pronto.</p>

            <div className="mt-6 space-y-3 max-w-md mx-auto text-left">
              <div className={`${progressStep >= 1 ? "font-medium text-indigo-700" : "text-slate-400"}`}>1. Enviando script para o HeyGen...</div>
              <div className={`${progressStep >= 2 ? "font-medium text-indigo-700" : "text-slate-400"}`}>2. Gerando áudio com sua voz...</div>
              <div className={`${progressStep >= 3 ? "font-medium text-indigo-700" : "text-slate-400"}`}>3. Renderizando vídeo com seu avatar...</div>
              <div className={`${progressStep >= 4 ? "font-medium text-indigo-700" : "text-slate-400"}`}>4. Finalizando...</div>
            </div>

            <div className="mt-6">
              <button onClick={() => cancelGeneration()} className="px-3 py-2 rounded bg-red-100 text-red-700">Cancelar geração</button>
            </div>
          </div>
        )}

        {ready && videoUrl && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold">PASSO 4: Resultado</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <video src={videoUrl} controls autoPlay muted className="w-full rounded" />
              </div>

              <div>
                <div className="text-sm">Créditos restantes: {(credits.total ?? 0) - (credits.used ?? 0)}/{credits.total ?? "—"}</div>
                <div className="text-sm mt-2">Duração (est): {estimatedSeconds ?? Math.round((script?.split(/\s+/).length ?? 0) * 0.5)}s</div>

                <div className="mt-4 flex flex-col gap-2">
                  <button onClick={() => handleSendToPostRapido()} className="px-3 py-2 rounded bg-indigo-600 text-white">Enviar para PostRápido →</button>
                  <a href={videoUrl} download className="px-3 py-2 rounded bg-gray-100 text-center">Download</a>
                  <button onClick={() => reset()} className="px-3 py-2 rounded bg-white border">Gerar Novo</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {failed && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-red-600">Erro na geração</h3>
            <p className="text-sm text-slate-600 mt-2">{error ?? "Falha na geração do vídeo"}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => handleGenerate()} className="px-3 py-2 rounded bg-indigo-600 text-white">Tentar Novamente</button>
              <button onClick={() => setStateToApproval(setScript)} className="px-3 py-2 rounded bg-gray-100">Editar Script</button>
              <button onClick={() => reset()} className="px-3 py-2 rounded bg-white border">Voltar ao Início</button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

// helper to set approval state from failed flow (keeps types simple inside file)
function setStateToApproval(setScript: (s: string) => void) {
  // no-op here; the hook exposes reset/approval actions; this placeholder keeps UI straightforward
  // In a more integrated implementation we'd call a hook action to set state to approval
  // For now, just an alert to instruct user
  // eslint-disable-next-line no-alert
  alert("Volte para o passo de aprovação para editar o script.");
}

export default Module3Page;