import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { saveMetricoolTokens, markOnboardingComplete } from "@/utils/onboarding";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { ModuleCard } from "@/components/dashboard";

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<number>(1);

  // Step 2 fields
  const [metricoolToken, setMetricoolToken] = useState("");
  const [metricoolUserId, setMetricoolUserId] = useState("");
  const [metricoolBlogId, setMetricoolBlogId] = useState<string>("");

  // Step 3 selected module
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const orgId = user?.organization_id;
  const userId = user?.id;

  const handleTestMetricool = async () => {
    if (!metricoolToken || !metricoolUserId) {
      showError("Preencha Token e User ID");
      return;
    }

    const toastId = showLoading("Testando conexão Metricool...");
    // If backend API doesn't exist, mock success
    try {
      // For now we attempt to save tokens directly to Supabase organizations
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
        <div className="mb-4 text-sm text-slate-500">Passo {step} de 4</div>

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
              <button onClick={() => setStep(1)} className="px-4 py-2 border rounded">← Voltar</button>
              <div className="space-x-2">
                <button onClick={handleTestMetricool} className="px-4 py-2 bg-gray-100 rounded">Testar Conexão</button>
                <button onClick={() => setStep(3)} className="px-4 py-2 bg-indigo-600 text-white rounded">Próximo →</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-xl font-semibold">Escolha o módulo inicial</h3>
            <p className="text-slate-500 mt-1">Qual módulo você quer usar primeiro?</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <ModuleCard title="Módulo 1: Pesquisa + Script" description="Pesquise temas e gere scripts com IA" badge="Em breve" onSelect={() => setSelectedModule("module-1")} />
              <ModuleCard title="Módulo 2: Upload + Edição" description="Faça upload, adicione legendas e agende posts" badge="Recomendado" onSelect={() => setSelectedModule("module-2")} />
              <ModuleCard title="Módulo 3: Avatar AI" description="Crie vídeos com avatar virtual automaticamente" badge="Plano Pro" disabled />
            </div>

            <div className="mt-4 flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 border rounded">← Voltar</button>
              <div className="space-x-2">
                <button onClick={() => { markOnboardingComplete(user?.id ?? ""); navigate("/dashboard"); }} className="px-4 py-2 border rounded">Decidir depois →</button>
                <button onClick={() => setStep(4)} className="px-4 py-2 bg-indigo-600 text-white rounded">Próximo →</button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
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