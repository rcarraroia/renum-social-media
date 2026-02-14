import React from "react";

type Props = {
  script: string;
  estimatedDuration?: number;
  userPlan: "free" | "starter" | "pro";
  heygenConfigured: boolean;
  onSelectTeleprompter: () => void;
  onSelectAvatar: () => void;
  onSaveDraft: () => void;
};

const Card: React.FC<{ title: string; subtitle: string; badge?: React.ReactNode; recommended?: boolean; onClick: () => void }> = ({ title, subtitle, badge, recommended, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow p-4 cursor-pointer transition hover:shadow-md ${recommended ? "border-2 border-indigo-200" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-bold">{title}</div>
          <div className="text-sm text-slate-500 mt-1">{subtitle}</div>
        </div>
        <div className="text-sm">{badge}</div>
      </div>
    </div>
  );
};

const NextSteps: React.FC<Props> = ({ script, estimatedDuration, userPlan, heygenConfigured, onSelectTeleprompter, onSelectAvatar, onSaveDraft }) => {
  return (
    <div className="space-y-4">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-green-600">🎯 Escolha a Jornada</h2>
        <p className="text-sm text-slate-500 mt-2">O que você quer fazer com este script aprovado?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          title="🎥 Gravar Você Mesmo"
          subtitle="Use o teleprompter integrado para gravar com sua câmera. O script rola na tela enquanto você grava."
          badge={<div className="text-xs px-2 py-0.5 rounded bg-indigo-100">Todos os planos</div>}
          recommended
          onClick={onSelectTeleprompter}
        />

        <Card
          title="🤖 Gerar com Avatar AI"
          subtitle="Seu avatar digital grava o vídeo automaticamente usando o script aprovado."
          badge={
            userPlan === "pro" ? (
              <div className="text-xs px-2 py-0.5 rounded bg-green-100">Plano Pro</div>
            ) : (
              <div className="text-xs px-2 py-0.5 rounded bg-slate-100">Pro — faça upgrade</div>
            )
          }
          onClick={onSelectAvatar}
        />

        <Card
          title="🔖 Salvar para Depois"
          subtitle="Salve o script como rascunho e volte quando quiser."
          badge={<div className="text-xs px-2 py-0.5 rounded bg-indigo-100">Todos os planos</div>}
          onClick={onSaveDraft}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-slate-600">Resumo do script</div>
        <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap max-h-36 overflow-auto">{script}</div>
        <div className="mt-3 text-xs text-slate-500">Duração estimada: {Math.floor((estimatedDuration ?? 0) / 60)}:{((estimatedDuration ?? 0) % 60).toString().padStart(2, "0")}</div>
      </div>
    </div>
  );
};

export default NextSteps;