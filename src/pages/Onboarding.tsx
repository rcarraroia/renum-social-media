import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { saveMetricoolTokens, markOnboardingComplete } from "@/utils/onboarding";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { ModuleCard } from "@/components/dashboard";
import ProfileSelector from "@/components/onboarding/ProfileSelector";
import { supabase } from "@/integrations/supabase/client";

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<number>(1);

  // Step 2 (new) profiles
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>((user as any)?.organization?.user_profiles ?? []);

  // Step 2 metricool fields (shifted to step 3 in this flow)
  const [metricoolToken, setMetricoolToken] = useState("");
  const [metricoolUserId, setMetricoolUserId] = useState("");
  const [metricoolBlogId, setMetricoolBlogId] = useState<string>("");

  // Step 4 selected module
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const orgId = user?.organization_id;
  const userId = user?.id;

  const saveProfilesToOrg = async () => {
    if (!orgId) {
      showError("Organização não encontrada");
      return false;
    }
    try {
      const toastId = showLoading("Salvando perfis...");
      const res: any = await (supabase.from("organizations") as any)
        .update({
          user_profiles: selectedProfiles,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orgId)
        .select()
        .single();
      dismissToast(toastId);
      if (res?.error) {
        showError("Erro ao salvar perfis");
        return false;
      }
      showSuccess("Perfis salvos!");
      return true;
    } catch (err: any) {
      showError("Erro ao salvar perfis");
      return false;
    }
  };

  const handleTestMetricool = async () => {
    if (!metricoolToken || !metricoolUserId) {
      showError("Preencha Token e User ID");
      return;
    }

    const toastId = showLoading("Testando conexão Metricool...");
    try {
      if (!orgId) throw new Error("Organization ID ausente");

      const { data, error } = await saveMetricoolTokens(orgId, {
        userToken: metricoolToken,
        userId: metricoolUserId,
        blogId: metricoolBlogId ? Number(metricoolBlogId) : undefined,
      });

      dismissToast(toastId);

      if (error) {
        console.error("Metricool save error:", error);
        showError("Falha ao conectar Metricool");
      } else {
        showSuccess("Metricool conectado com sucesso!");
      }
    } catch (err: any) {
      dismissToast(toastId);
      showError(err?.message ?? "Erro ao testar Metricool");
    }
  };

  const handleCompleteProfiles = async () => {
    // must have at least one
    if (!userId) {
      showError("Usuário não encontrado");
      return;
    }
    if (!selectedProfiles || selectedProfiles.length === 0) {
      showError("Selecione ao menos um perfil");
      return;
    }

    const ok = await saveProfilesToOrg();
    if (!ok) return;

    // move to next step (metricool)
    setStep(3);
  };

  const handleComplete = () => {
    if (!userId) {
      showError("Usuário não encontrado");
      return;
    }
    markOnboardingComplete(userId, selectedModule ?? undefined);
    showSuccess("Onboarding finalizado!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow p-6">
        <div className="mb-4 text-sm text-slate-500">Passo {step} de 5</div>

        {step === 1 && (
          <div className="text-center space-y-4">
            <div className="text-3xl font-bold">Bem-vindo ao RENUM Social AI! 🎉</div>
            <div className="text-slate-600">Automatize a criação e agendamento de vídeos para redes sociais</div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded">
                <div className="text-2xl">✨</div>
                <div className="font-medium mt-2">Gere scripts com IA</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-2xl">🎬</div>
                <div className="font-medium mt-2">Crie vídeos com avatar virtual</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-2xl">📅</div>
                <div className="font-medium mt-2">Agende posts automaticamente</div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-2 bg-indigo-600 text-white rounded">Começar →</button>
              <button onClick={() => { if (userId) { markOnboardingComplete(userId); navigate("/dashboard"); } else navigate("/dashboard"); }} className="px-6 py-2 border rounded">Pular por agora</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-xl font-semibold">Passo 2: Configure seus perfis</h3>
            <p className="text-slate-500 mt-1">Selecione um ou mais perfis que descrevem sua atuação — isso ajuda a gerar scripts mais relevantes.</p>

            <div className="mt-4">
              <ProfileSelector value={selectedProfiles} onChange={setSelectedProfiles} />
            </div>

            <div className="mt-4 flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 border rounded">← Voltar</button>
              <div className="space-x-2">
                <button onClick={() => {
                  setSelectedProfiles(selectedProfiles.length ? selectedProfiles : ["general"]);
                  setStep(3);
                }} className="px-4 py-2 bg-gray-100 rounded">Pular</button>
                <button onClick={handleCompleteProfiles} className="px-4 py-2 bg-indigo-600 text-white rounded">Salvar e Continuar →</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-xl font-semibold">Conecte sua conta Metricool</h3>
            <p className="text-slate-500 mt-1">O RENUM usa o Metricool para agendar seus posts.</p>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="text-sm">User Token</label>
              <input value={metricoolToken} onChange={(e) => setMetricoolToken(e.target.value)} className="w-full rounded border p-2" />
              <label className="text-sm mt-2">User ID (numérico)</label>
              <input value={metricoolUserId} onChange={(e) => setMetricoolUserId(e.target.value)} className="w-full rounded border p-2" />
              <label className="text-sm mt-2">Blog ID (opcional)</label>
              <input value={metricoolBlogId} onChange={(e) => setMetricoolBlogId(e.target.value)} className="w-full rounded border p-2" />
            </div>

            <div className="mt-4 flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 border rounded">← Voltar</button>
              <div className="space-x-2">
                <button onClick={handleTestMetricool} className="px-4 py-2 bg-gray-100 rounded">Testar Conexão</button>
                <button onClick={() => setStep(4)} className="px-4 py-2 bg-indigo-600 text-white rounded">Próximo →</button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="text-xl font-semibold">Escolha o módulo inicial</h3>
            <p className="text-slate-500 mt-1">Qual módulo você quer usar primeiro?</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <ModuleCard title="📝 ScriptAI" description="Pesquise temas e gere scripts com IA" badge="Novo" onSelect={() => setSelectedModule("scriptai")} />
              <ModuleCard title="⚡ PostRápido" description="Faça upload, adicione legendas e agende posts" badge="Em breve" onSelect={() => setSelectedModule("postrapido")} />
              <ModuleCard title="🤖 AvatarAI" description="Crie vídeos com avatar virtual automaticamente" badge="Plano Pro" onSelect={() => setSelectedModule("avatarai")} />
            </div>

            <div className="mt-4 flex justify-between">
              <button onClick={() => setStep(3)} className="px-4 py-2 border rounded">← Voltar</button>
              <div className="space-x-2">
                <button onClick={() => { markOnboardingComplete(user?.id ?? ""); navigate("/dashboard"); }} className="px-4 py-2 border rounded">Decidir depois →</button>
                <button onClick={() => setStep(5)} className="px-4 py-2 bg-indigo-600 text-white rounded">Próximo →</button>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center">
            <div className="text-4xl">🎉</div>
            <h3 className="text-2xl font-bold mt-2">Configuração Completa!</h3>
            <p className="text-slate-600 mt-2">Sua conta foi configurada com sucesso.</p>

            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => handleComplete()} className="px-6 py-2 bg-indigo-600 text-white rounded">Ir para Dashboard →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;