import React from "react";
import MainLayout from "../components/layout/MainLayout";
import ThemeInput from "../components/modules/ThemeInput";
import ScriptPreview from "../components/modules/ScriptPreview";
import NextSteps from "../components/modules/NextSteps";
import VideoConfigStep from "@/components/modules/VideoConfigStep";
import TeleprompterControls from "@/components/modules/TeleprompterControls";
import TeleprompterRecorder from "@/components/modules/TeleprompterRecorder";
import { useResearch } from "../hooks/useResearch";
import { useTeleprompter } from "../hooks/useTeleprompter";
import { useAuth } from "@/hooks/useAuth";
import { showLoading, dismissToast, showSuccess, showError } from "../utils/toast";
import { useNavigate } from "react-router-dom";
import type { AspectRatio, Platform } from "@/lib/compatibility";

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
    saving_draft,
  } = useResearch();

  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { saveVideo, uploading: savingVideo, videoId: savedVideoId, videoUrl: savedVideoUrl } = useTeleprompter();

  const [activeTab, setActiveTab] = React.useState<"new" | "drafts">("new");
  const [teleprompterActive, setTeleprompterActive] = React.useState(false);

  // Teleprompter states
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [scrollSpeed, setScrollSpeed] = React.useState(5);
  const [fontSize, setFontSize] = React.useState(24);
  const [textOpacity, setTextOpacity] = React.useState(0.7);
  const [textArea, setTextArea] = React.useState(50);
  const [textPosition, setTextPosition] = React.useState<"top" | "center" | "bottom">("center");
  const [textColor, setTextColor] = React.useState<"white" | "yellow">("white");
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const animationFrameRef = React.useRef<number | null>(null);

  // Video recording state
  const [recordedVideo, setRecordedVideo] = React.useState<Blob | null>(null);
  const [isSaved, setIsSaved] = React.useState(false);

  // Teleprompter toggle
  const [teleprompterEnabled, setTeleprompterEnabled] = React.useState(true);

  const handleSaveVideo = async () => {
    if (!recordedVideo) return;

    const result = await saveVideo(recordedVideo, {
      aspectRatio: aspectRatio || "9:16",
      selectedPlatforms: selectedPlatforms,
      script: script || "",
      theme: theme,
      audience: audience,
      durationSeconds: Math.round((script?.split(/\s+/).length ?? 0) * 0.5),
    });

    if (result) {
      setIsSaved(true);
    }
  };

  const handleSendToPostRapido = () => {
    if (!savedVideoId) return;
    
    // Navigate to Module2 with video data
    navigate("/module-2", {
      state: {
        fromTeleprompter: true,
        videoId: savedVideoId,
        videoUrl: savedVideoUrl,
        aspectRatio: aspectRatio || "9:16",
        selectedPlatforms: selectedPlatforms,
      },
    });
  };

  // For testing: add a sample script button
  const loadSampleScript = () => {
    setTheme("Benefícios da vitamina D para a pele");
    setAudience("general");
    setScript("Você sabia que a vitamina D é essencial para a saúde da sua pele? Além de fortalecer os ossos, ela ajuda a combater inflamações, reduzir acne e até prevenir o envelhecimento precoce. A exposição solar moderada é a melhor fonte, mas suplementos também podem ajudar. Cuide da sua pele de dentro para fora!");
    setStep(2);
  };

  // HeyGen config detection (mocked via user.organization)
  const heygenConfigured = Boolean(user?.organization?.heygen_api_key);

  // Stepper labels: 1.Theme, 2.Preview, 3.Config, 4.Journey, 5.Destination (teleprompter)
  const goToTeleprompter = () => {
    // Validar se script existe antes de ir para teleprompter
    if (!script || script.trim().length === 0) {
      showError("Nenhum script disponível. Gere um script primeiro.");
      console.error('[DEBUG] Script vazio ao tentar ir para teleprompter');
      return;
    }
    
    console.log('[DEBUG] Indo para teleprompter com script:', script.substring(0, 50) + '...');
    console.log('[DEBUG] Script length:', script.length);
    
    setTeleprompterActive(true);
    setStep(5);
    // Reset teleprompter states
    setIsScrolling(false);
    setScrollPosition(0);
    setTeleprompterEnabled(true); // Ativar teleprompter por padrão
  };

  // Teleprompter scroll logic
  React.useEffect(() => {
    if (!isScrolling || !scrollContainerRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const scroll = () => {
      if (!scrollContainerRef.current) return;

      // Calculate scroll increment based on speed (1-10)
      // Speed 1 = 0.2px per frame, Speed 10 = 2px per frame
      const increment = scrollSpeed * 0.2;

      setScrollPosition((prev) => {
        const newPosition = prev + increment;
        const maxScroll = scrollContainerRef.current!.scrollHeight - scrollContainerRef.current!.clientHeight;

        // Stop at the end
        if (newPosition >= maxScroll) {
          setIsScrolling(false);
          return maxScroll;
        }

        return newPosition;
      });

      animationFrameRef.current = requestAnimationFrame(scroll);
    };

    animationFrameRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScrolling, scrollSpeed]);

  // Update scroll position
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const handleToggleScroll = () => {
    setIsScrolling(!isScrolling);
  };

  const handleSpeedChange = (speed: number) => {
    setScrollSpeed(speed);
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
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
            <div className="text-sm text-slate-400">Passo {Math.min(step, 5)} de 5</div>
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

                {step === 5 && teleprompterActive && (
                  <div className="space-y-4">
                    {/* DEBUG: Verificar se script existe */}
                    {(() => {
                      console.log('[DEBUG] Renderizando Step 5 - Script:', script?.substring(0, 50) + '...');
                      console.log('[DEBUG] Script length:', script?.length);
                      console.log('[DEBUG] Teleprompter enabled:', teleprompterEnabled);
                      return null;
                    })()}
                    
                    {/* Aspect Ratio Selector */}
                    <div className="bg-white rounded-lg shadow p-4">
                      <h3 className="text-sm font-semibold mb-2">Proporção do Vídeo</h3>
                      <div className="flex gap-2">
                        {(["9:16", "1:1", "16:9"] as AspectRatio[]).map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`px-4 py-2 rounded border-2 transition-colors ${
                              aspectRatio === ratio
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {ratio}
                            <span className="block text-xs text-slate-500">
                              {ratio === "9:16" && "Stories/Reels"}
                              {ratio === "1:1" && "Feed"}
                              {ratio === "16:9" && "YouTube"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Video Recorder com Script Integrado */}
                    <TeleprompterRecorder
                      aspectRatio={aspectRatio || "9:16"}
                      script={script}
                      fontSize={fontSize}
                      textOpacity={textOpacity}
                      textArea={textArea}
                      textPosition={textPosition}
                      textColor={textColor}
                      isScrolling={isScrolling}
                      scrollPosition={scrollPosition}
                      teleprompterEnabled={teleprompterEnabled}
                      onToggleTeleprompter={() => setTeleprompterEnabled(!teleprompterEnabled)}
                      onStartScroll={() => setIsScrolling(true)}
                      onRecordingComplete={(blob) => {
                        setRecordedVideo(blob);
                        showSuccess("Vídeo gravado com sucesso!");
                      }}
                      onCameraReady={(stream) => {
                        console.log("Camera ready:", stream);
                      }}
                      onError={(error) => {
                        showError(`Erro na gravação: ${error}`);
                      }}
                    />

                    {/* Teleprompter Controls */}
                    <TeleprompterControls
                      isScrolling={isScrolling}
                      scrollSpeed={scrollSpeed}
                      fontSize={fontSize}
                      textOpacity={textOpacity}
                      textArea={textArea}
                      textPosition={textPosition}
                      textColor={textColor}
                      onToggleScroll={handleToggleScroll}
                      onSpeedChange={handleSpeedChange}
                      onFontSizeChange={handleFontSizeChange}
                      onOpacityChange={setTextOpacity}
                      onTextAreaChange={setTextArea}
                      onPositionChange={setTextPosition}
                      onColorChange={setTextColor}
                    />

                    {/* Script Container REMOVIDO - agora está sobreposto à câmera */}

                    {/* Recorded Video Preview */}
                    {recordedVideo && (
                      <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold">
                            {isSaved ? "✅ Vídeo Salvo" : "🎬 Vídeo Gravado"}
                          </h3>
                          {isSaved && savedVideoUrl && (
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                              Salvo no banco de dados
                            </span>
                          )}
                        </div>
                        
                        <video
                          src={isSaved && savedVideoUrl ? savedVideoUrl : URL.createObjectURL(recordedVideo)}
                          controls
                          className="w-full rounded"
                          style={{ aspectRatio: (aspectRatio || "9:16").replace(":", "/") }}
                        />
                        
                        <div className="mt-4 flex gap-2 flex-wrap">
                          {!isSaved ? (
                            <>
                              <button
                                onClick={handleSaveVideo}
                                disabled={savingVideo}
                                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                              >
                                {savingVideo ? "Salvando..." : "💾 Salvar Vídeo"}
                              </button>
                              <button
                                onClick={() => {
                                  setRecordedVideo(null);
                                  setIsSaved(false);
                                }}
                                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                              >
                                🗑️ Descartar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={handleSendToPostRapido}
                                className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2"
                              >
                                📤 Enviar para PostRápido
                              </button>
                              <button
                                onClick={() => {
                                  const url = savedVideoUrl || URL.createObjectURL(recordedVideo);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `teleprompter-video-${Date.now()}.webm`;
                                  a.click();
                                  if (!savedVideoUrl) URL.revokeObjectURL(url);
                                }}
                                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                              >
                                💾 Baixar Vídeo
                              </button>
                              <button
                                onClick={() => {
                                  setRecordedVideo(null);
                                  setIsSaved(false);
                                }}
                                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                              >
                                🔄 Gravar Novamente
                              </button>
                            </>
                          )}
                        </div>
                        
                        {isSaved && (
                          <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-3 rounded">
                            <strong>ID do Vídeo:</strong> {savedVideoId}
                            <br />
                            <strong>Proporção:</strong> {aspectRatio || "9:16"}
                            <br />
                            <strong>Plataformas:</strong> {selectedPlatforms.join(", ") || "Nenhuma"}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between">
                      <button
                        onClick={() => {
                          setTeleprompterActive(false);
                          setStep(4);
                          setIsScrolling(false);
                          setScrollPosition(0);
                          setRecordedVideo(null);
                          setIsSaved(false);
                        }}
                        className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        ← Voltar
                      </button>
                      {recordedVideo && isSaved && (
                        <button
                          onClick={handleSendToPostRapido}
                          className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Continuar para PostRápido →
                        </button>
                      )}
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
          {activeTab === "new" && step < 5 && step !== 1 && (
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
