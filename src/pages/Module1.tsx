import React from "react";
import MainLayout from "../components/layout/MainLayout";
import ThemeInput from "../components/modules/ThemeInput";
import ScriptPreview from "../components/modules/ScriptPreview";
import NextSteps from "../components/modules/NextSteps";
import VideoConfigStep from "@/components/modules/VideoConfigStep";
import { useResearch } from "../hooks/useResearch";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics } from "@/services/analytics";
import { showError } from "../utils/toast";
import { useNavigate, useLocation } from "react-router-dom";
import type { AspectRatio } from "@/lib/compatibility";

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
    aspectRatio,
    setAspectRatio,
    selectedPlatforms,
    setSelectedPlatforms,
    createScript,
    regenerateScript,
    approveScript,
    drafts,
    loadingDrafts,
    saveDraft,
    deleteDraft,
    loadDraftIntoEditor,
    loading,
  } = useResearch();

  const { user } = useAuth();
  const analytics = useAnalytics();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = React.useState<"new" | "drafts">("new");
  const [recordedVideo, setRecordedVideo] = React.useState<Blob | null>(null);

  // Receber vídeo gravado de volta da página de teleprompter
  React.useEffect(() => {
    if (location.state?.recordedVideo) {
      setRecordedVideo(location.state.recordedVideo);
      setStep(4); // Voltar para step 4 com vídeo gravado
      
      // Limpar state para não recarregar
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setStep]);

  // For testing: add a sample script button
  const loadSampleScript = () => {
    setTheme("Benefícios da vitamina D para a pele");
    setAudience("general");
    setScript("Você sabia que a vitamina D é essencial para a saúde da sua pele? Além de fortalecer os ossos, ela ajuda a combater inflamações, reduzir acne e até prevenir o envelhecimento precoce. A exposição solar moderada é a melhor fonte, mas suplementos também podem ajudar. Cuide da sua pele de dentro para fora!");
    setStep(2);
  };

  // HeyGen config detection (mocked via user.organization)
  const heygenConfigured = Boolean(user?.organization?.heygen_api_key);

  // Navegar para página de gravação fullscreen
  const goToTeleprompter = () => {
    // Validar se script existe antes de ir para teleprompter
    if (!script || script.trim().length === 0) {
      showError("Nenhum script disponível. Gere um script primeiro.");
      return;
    }

    // Track navigation to teleprompter
    analytics.trackFeatureUsed("Teleprompter Started", {
      theme,
      audience,
      scriptLength: script.length,
      aspectRatio: aspectRatio || "9:16",
      platforms: selectedPlatforms,
    });
    
    // Navegar para nova página de gravação fullscreen
    navigate("/module-1/teleprompter", {
      state: {
        script,
        aspectRatio: aspectRatio || "9:16",
        recordTextInVideo: false,
        theme,
        audience,
        selectedPlatforms,
      },
    });
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
        aspectRatio,
        selectedPlatforms,
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
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/my-videos")}
              className="text-xs px-3 py-1 rounded bg-indigo-100 text-indigo-800 hover:bg-indigo-200 flex items-center gap-1"
            >
              🎬 Meus Vídeos
            </button>
            <button 
              onClick={loadSampleScript}
              className="text-xs px-3 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            >
              🧪 Carregar Script de Teste
            </button>
            <div className="text-sm text-slate-400">Passo {Math.min(step, 4)} de 4</div>
          </div>
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
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-4">PASSO 3: Configurar Vídeo</h3>
                    <VideoConfigStep
                      onComplete={(config) => {
                        setAspectRatio(config.aspectRatio);
                        setSelectedPlatforms(config.platforms);
                        setStep(4); // Move to journey selection
                      }}
                      onBack={() => setStep(2)}
                      initialAspectRatio={aspectRatio || undefined}
                      initialPlatforms={selectedPlatforms}
                    />
                  </div>
                )}

                {step === 4 && (
                  <>
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

                    {/* Vídeo gravado */}
                    {recordedVideo && (
                      <div className="bg-white rounded-lg shadow p-4 mt-4">
                        <h3 className="text-lg font-semibold mb-3">🎬 Vídeo Gravado</h3>
                        
                        <video
                          src={URL.createObjectURL(recordedVideo)}
                          controls
                          className="w-full rounded"
                          style={{ aspectRatio: (aspectRatio || "9:16").replace(":", "/") }}
                        />
                        
                        <div className="mt-4 flex gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              navigate("/module-2/post-rapido", {
                                state: {
                                  fromTeleprompter: true,
                                  videoBlob: recordedVideo,
                                  aspectRatio: aspectRatio || "9:16",
                                  selectedPlatforms: selectedPlatforms,
                                },
                              });
                            }}
                            className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2"
                          >
                            📤 Enviar para PostRápido
                          </button>
                          <button
                            onClick={() => {
                              const url = URL.createObjectURL(recordedVideo);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `teleprompter-video-${Date.now()}.webm`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                          >
                            💾 Baixar Vídeo
                          </button>
                          <button
                            onClick={() => {
                              setRecordedVideo(null);
                              goToTeleprompter();
                            }}
                            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                          >
                            🔄 Gravar Novamente
                          </button>
                        </div>
                      </div>
                    )}
                  </>
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
          <button 
            onClick={() => { if (step > 1) setStep(step - 1); }} 
            disabled={step === 1}
            className={`px-4 py-2 rounded min-h-[44px] ${step === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100"}`}
          >
            ← Voltar
          </button>
          
          {/* 
            TODO: REMOVER ANTES DO LANÇAMENTO
            Navigation for testing/preview - allow moving forward to see all steps 
            Estes botões são apenas para desenvolvimento/testes
          */}
          {activeTab === "new" && step < 4 && step !== 1 && (
            <button 
              onClick={() => setStep(step + 1)} 
              className="px-4 py-2 rounded bg-indigo-600 text-white min-h-[44px]"
            >
              Próximo Passo → (DEV)
            </button>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Module1Page;
