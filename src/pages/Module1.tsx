import React from "react";
import MainLayout from "../components/layout/MainLayout";
import ThemeInput from "../components/modules/ThemeInput";
import ScriptPreview from "../components/modules/ScriptPreview";
import NextSteps from "../components/modules/NextSteps";
import { useResearch } from "../hooks/useResearch";
import { useAuth } from "@/hooks/useAuth";
import { showLoading, dismissToast, showSuccess, showError } from "../utils/toast";
import { useNavigate } from "react-router-dom";

const Module1Page: React.FC = () => {
  const {
    step,
    setStep,
    theme,
    setTheme,
    audience,
    setAudience,
    script,
    setScript,
    createScript,
    regenerateScript,
    approveScript,
    drafts,
    loadingDrafts,
    saveDraft,
    deleteDraft,
    loadDraftIntoEditor,
    loading,
    saving_draft,
  } = useResearch();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = React.useState<"new" | "drafts">("new");
  const [teleprompterActive, setTeleprompterActive] = React.useState(false);

  // HeyGen config detection (mocked via user.organization)
  const heygenConfigured = Boolean(user?.organization?.heygen_api_key);

  // Stepper labels: 1.Theme, 2.Preview, 3.Journey, 4.Destination (teleprompter)
  const goToTeleprompter = () => {
    setTeleprompterActive(true);
    setStep(4);
  };

  const handleSelectAvatar = () => {
    // Avatar flow depends on plan & heygenConfigured
    const userPlan = (user?.organization?.plan as "free" | "starter" | "pro") ?? "free";
    if (userPlan !== "pro") {
      // show upgrade
      alert("Recurso PRO — faça upgrade para acessar AvatarAI");
      return;
    }
    if (!heygenConfigured) {
      if (confirm("HeyGen não configurado. Ir para Configurações?")) {
        navigate("/settings");
      }
      return;
    }
    // navigate to module-3 passing script and metadata
    navigate("/module-3/avatar-ai", {
      state: {
        fromModule1: true,
        script,
        theme,
        audience,
        estimated_seconds: Math.round((script?.split(/\s+/).length ?? 0) * 0.5),
      },
    });
  };

  const handleSaveDraft = async () => {
    if (!script || script.trim().length === 0) {
      showError("Nenhum script para salvar");
      return;
    }
    await saveDraft({ theme, audience, script, estimated_seconds: Math.round((script?.split(/\s+/).length ?? 0) * 0.5) });
  };

  const handleApprove = () => {
    // Approve flows to Journey selection
    if (!script || script.trim().length === 0) {
      showError("Script vazio — não é possível aprovar");
      return;
    }
    approveScript();
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📝 ScriptAI</h1>
            <p className="text-sm text-slate-500">Pesquise temas e gere scripts com IA</p>
          </div>
          <div className="text-sm text-slate-400">Passo {Math.min(step, 4)} de 4</div>
        </div>

        {/* Tabs: Generate New | My Drafts */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab("new")} className={`px-4 py-2 rounded ${activeTab === "new" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>Gerar Novo</button>
            <button onClick={() => setActiveTab("drafts")} className={`px-4 py-2 rounded ${activeTab === "drafts" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>Meus Rascunhos</button>
          </div>

          <div className="mt-4">
            {activeTab === "new" ? (
              <>
                {step === 1 && (
                  <ThemeInput
                    createScript={createScript}
                    theme={theme}
                    setTheme={setTheme}
                    audience={audience}
                    setAudience={setAudience}
                    loading={loading}
                  />
                )}

                {step === 2 && (
                  <ScriptPreview
                    script={script}
                    audience={audience}
                    onRegenerate={() => regenerateScript()}
                    onApprove={handleApprove}
                    onEditScript={(s) => setScript(s)}
                    loading={loading}
                  />
                )}

                {step === 3 && (
                  <NextSteps
                    script={script}
                    estimatedDuration={Math.round((script?.split(/\s+/).length ?? 0) * 0.5)}
                    userPlan={(user?.organization?.plan as "free" | "starter" | "pro") ?? "free"}
                    heygenConfigured={heygenConfigured}
                    onSelectTeleprompter={() => {
                      goToTeleprompter();
                    }}
                    onSelectAvatar={() => handleSelectAvatar()}
                    onSaveDraft={() => handleSaveDraft()}
                  />
                )}

                {step === 4 && teleprompterActive && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold">Teleprompter (em desenvolvimento)</h3>
                    <p className="text-sm text-slate-500 mt-2">Teleprompter em desenvolvimento — preview do script:</p>
                    <div className="mt-4 h-60 overflow-auto rounded border p-3 bg-black text-white whitespace-pre-wrap">
                      {script}
                    </div>
                    <div className="mt-4">
                      <button onClick={() => { setTeleprompterActive(false); setStep(3); }} className="px-4 py-2 rounded bg-gray-100">← Voltar</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-3">Meus Rascunhos</h3>
                {loadingDrafts ? (
                  <div>Carregando rascunhos...</div>
                ) : (
                  <div className="space-y-3">
                    {drafts.length === 0 && <div className="text-sm text-slate-500">Nenhum rascunho salvo ainda.</div>}
                    {drafts.map((d: any) => (
                      <div key={d.id} className="p-3 border rounded flex items-center justify-between">
                        <div>
                          <div className="font-medium">{d.theme}</div>
                          <div className="text-xs text-slate-500">Criado: {new Date(d.created_at).toLocaleString()} • Público: {d.audience}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { loadDraftIntoEditor(d.id); setActiveTab("new"); }} className="px-3 py-1 rounded bg-indigo-600 text-white">Usar este script</button>
                          <button onClick={() => { if (confirm("Tem certeza que deseja excluir este rascunho?")) deleteDraft(d.id); }} className="px-3 py-1 rounded bg-red-100 text-red-700">Excluir</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center">
          <div />
          <div>
            <button onClick={() => { if (step > 1) setStep(step - 1); }} className="px-4 py-2 rounded bg-gray-100 mr-2">← Voltar</button>
            {step === 1 && (
              <button onClick={() => createScript()} className="px-4 py-2 rounded bg-indigo-600 text-white">Gerar Script →</button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Module1Page;