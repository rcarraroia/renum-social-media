import React from "react";
import { useNavigate } from "react-router-dom";
import { showSuccess } from "@/utils/toast";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  videoId?: string | null;
  script: string;
  userPlan: "free" | "starter" | "pro";
};

const NextSteps: React.FC<Props> = ({ videoId, script, userPlan }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(script);
      showSuccess("✅ Script copiado para a área de transferência!");
    } catch {
      // ignore
    }
  };

  const goToUpload = () => {
    navigate("/module-2/post-rapido", {
      state: {
        suggestedDescription: (script ?? "").slice(0, 300),
        fromModule1: true,
        videoId: videoId ?? null,
      },
    });
  };

  const goToAvatarAI = () => {
    if (userPlan !== "pro") {
      // redirect to settings plan
      navigate("/settings?tab=plan");
      return;
    }

    // If we have a videoId, pass it as query param so Module3 can load the script.
    if (videoId) {
      navigate(`/module-3/avatar-ai?video_id=${encodeURIComponent(videoId)}`);
    } else {
      // if no videoId, we still can navigate and Module3 will start blank
      navigate(`/module-3/avatar-ai`);
    }
  };

  const saveAndDashboard = () => {
    showSuccess("💾 Script salvo nos seus rascunhos");
    navigate("/dashboard");
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow p-4">
      <div className="text-lg font-semibold mb-3">Próximos passos — escolha uma jornada</div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <div className="p-3 border rounded flex flex-col">
          <div className="font-medium">📹 Gravar Você Mesmo</div>
          <div className="text-sm text-slate-500 mt-2 flex-1">
            Copie o script e grave com seu celular. Depois envie pelo PostRápido.
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={copyScript} className="px-3 py-1 rounded bg-gray-100">📋 Copiar Script</button>
            <button onClick={goToUpload} className="px-3 py-1 rounded bg-indigo-600 text-white">📹 Ir para Upload →</button>
          </div>
        </div>

        <div className="p-3 border rounded flex flex-col">
          <div className="font-medium">🤖 Gerar com Avatar AI</div>
          <div className="text-sm text-slate-500 mt-2 flex-1">
            Gere um vídeo automaticamente com avatar falante (recurso PRO).
          </div>
          <div className="mt-3">
            {userPlan === "pro" ? (
              <button onClick={goToAvatarAI} className="px-3 py-1 rounded bg-indigo-600 text-white">🎬 Gerar com Avatar AI →</button>
            ) : (
              <div className="flex gap-2 items-center">
                <div className="text-xs px-2 py-0.5 rounded bg-yellow-100">Plano Pro</div>
                <button onClick={() => navigate("/settings?tab=plan")} className="px-3 py-1 rounded bg-gray-100">Fazer Upgrade →</button>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border rounded flex flex-col">
          <div className="font-medium">💾 Salvar para Depois</div>
          <div className="text-sm text-slate-500 mt-2 flex-1">
            Salve o script em rascunhos e retome quando quiser.
          </div>
          <div className="mt-3">
            <button onClick={saveAndDashboard} className="px-3 py-1 rounded bg-gray-100">← Voltar ao Dashboard</button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-slate-600 mb-2">Prévia do Script</div>
        <div className="p-3 bg-slate-50 rounded text-sm whitespace-pre-wrap max-h-48 overflow-auto">{script}</div>
      </div>
    </div>
  );
};

export default NextSteps;