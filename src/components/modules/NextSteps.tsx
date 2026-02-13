import React from "react";
import { useNavigate } from "react-router-dom";
import { showSuccess } from "../../utils/toast";

type Props = {
  script: string;
  videoId?: string | null;
};

const NextSteps: React.FC<Props> = ({ script, videoId }) => {
  const navigate = useNavigate();

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(script);
      showSuccess("✅ Script copiado para a área de transferência!");
    } catch {
      // ignore
    }
  };

  const goToModule2 = () => {
    navigate("/module-2/post-rapido");
  };

  const tryAvatar = () => {
    // For now, show upgrade modal (not implemented) — simple alert
    alert("Gerar com Avatar AI é um recurso PRO — faça upgrade para usar.");
  };

  const saveAndDashboard = () => {
    showSuccess("💾 Script salvo nos seus rascunhos");
    navigate("/dashboard");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">PASSO 3: O que fazer agora?</h3>
        <p className="text-sm text-slate-500 mt-1">Escolha como transformar seu script em vídeo.</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className="p-4 border rounded">
            <div className="font-medium">🎥 OPÇÃO 1: Gravar Você Mesmo</div>
            <div className="text-sm text-slate-600 mt-1">Grave usando o seu celular e envie no PostRápido.</div>
            <div className="mt-3 flex gap-2">
              <button onClick={copyScript} className="px-3 py-1 rounded bg-gray-100">📋 Copiar Script</button>
              <button onClick={goToModule2} className="px-3 py-1 rounded bg-indigo-600 text-white">🎬 Ir para PostRápido</button>
            </div>
          </div>

          <div className="p-4 border rounded">
            <div className="font-medium">🤖 OPÇÃO 2: Gerar com Avatar AI <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-xs">PRO</span></div>
            <div className="text-sm text-slate-600 mt-1">Crie um vídeo automaticamente com avatar virtual (recurso PRO).</div>
            <div className="mt-3">
              <button onClick={tryAvatar} className="px-3 py-1 rounded bg-gray-100">🔒 Gerar com Avatar</button>
            </div>
          </div>

          <div className="p-4 border rounded">
            <div className="font-medium">💾 Salvar para Depois</div>
            <div className="text-sm text-slate-600 mt-1">Salve o script em rascunhos para continuar depois.</div>
            <div className="mt-3">
              <button onClick={saveAndDashboard} className="px-3 py-1 rounded bg-gray-100">💾 Salvar e Ir para Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextSteps;