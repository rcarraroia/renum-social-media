import React from "react";
import MainLayout from "../components/layout/MainLayout";
import ThemeInput from "../components/modules/ThemeInput";
import ScriptPreview from "../components/modules/ScriptPreview";
import NextSteps from "../components/modules/NextSteps";
import { useResearch } from "../hooks/useResearch";

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
    status,
    createScript,
    regenerateScript,
    approveScript,
    videoId,
  } = useResearch();

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Módulo 1: Pesquisa + Script</h1>
            <p className="text-sm text-slate-500">Gere scripts inteligentes com IA e personalize antes de transformar em vídeo.</p>
          </div>
          <div className="text-sm text-slate-400">Passo {step} de 3</div>
        </div>

        <div className="space-y-4">
          {step === 1 && (
            <ThemeInput
              createScript={createScript}
              theme={theme}
              setTheme={setTheme}
              audience={audience}
              setAudience={setAudience}
              loading={status === "searching" || status === "generating"}
            />
          )}

          {step === 2 && (
            <div>
              {status === "searching" && (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
                  <div className="mt-4 text-lg font-medium">🔍 Pesquisando informações...</div>
                  <div className="text-sm text-slate-500 mt-2">Estamos buscando fontes relevantes e dados para gerar o melhor script.</div>
                </div>
              )}

              {status === "generating" && (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
                  <div className="mt-4 text-lg font-medium">🤖 Gerando seu script...</div>
                  <div className="text-sm text-slate-500 mt-2">A IA está escrevendo um script otimizado para seu público.</div>
                </div>
              )}

              {status === "ready" && (
                <ScriptPreview
                  script={script}
                  onRegenerate={() => regenerateScript()}
                  onApprove={() => approveScript()}
                  onEditScript={(s) => setScript(s)}
                />
              )}
            </div>
          )}

          {step === 3 && (
            <NextSteps script={script} videoId={videoId} />
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => {
                  if (confirm("Voltar para o passo anterior? O script atual será mantido.")) {
                    setStep(step - 1);
                  }
                }}
                className="px-3 py-2 rounded bg-gray-100"
              >
                ← Voltar
              </button>
            )}
          </div>

          <div>
            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                className="px-4 py-2 rounded bg-indigo-600 text-white"
              >
                Próximo →
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Module1Page;