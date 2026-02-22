import React from "react";
import HeyGenSetupWizard from "./HeyGenSetupWizard";

/**
 * Componente de demonstração do HeyGenSetupWizard
 * 
 * Este componente pode ser usado para testar o wizard isoladamente
 * ou como referência de como integrá-lo em outras páginas.
 */

const HeyGenSetupWizardDemo: React.FC = () => {
  const handleComplete = (data: { apiKey: string; avatarId: string; voiceId: string }) => {
    console.log("Wizard concluído com sucesso:", data);
    alert(`Configuração salva!\nAPI Key: ${data.apiKey.substring(0, 10)}...\nAvatar ID: ${data.avatarId || "Não selecionado"}\nVoice ID: ${data.voiceId || "Não selecionado"}`);
  };

  const handleCancel = () => {
    console.log("Wizard cancelado");
    alert("Configuração cancelada");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">HeyGen Setup Wizard</h1>
          <p className="text-slate-600 mt-2">Demonstração do wizard de configuração HeyGen</p>
        </div>

        <HeyGenSetupWizard onComplete={handleComplete} onCancel={handleCancel} />

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Como usar este componente:</h2>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <strong>1. Importar:</strong>
              <pre className="mt-1 p-2 bg-slate-50 rounded text-xs overflow-x-auto">
                {`import HeyGenSetupWizard from "@/components/heygen/HeyGenSetupWizard";`}
              </pre>
            </div>
            <div>
              <strong>2. Usar no seu componente:</strong>
              <pre className="mt-1 p-2 bg-slate-50 rounded text-xs overflow-x-auto">
{`<HeyGenSetupWizard
  onComplete={(data) => {
    // Salvar configuração no banco
    console.log(data);
  }}
  onCancel={() => {
    // Voltar para tela anterior
  }}
/>`}
              </pre>
            </div>
            <div>
              <strong>3. Funcionalidades implementadas:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
                <li>✅ Campo de API Key com toggle show/hide</li>
                <li>✅ Validação de API Key via endpoint do backend</li>
                <li>✅ Estados: idle → loading → success → error</li>
                <li>✅ Feedback visual com ícones e mensagens</li>
                <li>✅ Link para criar conta no HeyGen</li>
                <li>✅ Stepper visual de 2 passos</li>
                <li>✅ Responsivo e acessível</li>
                <li>🚧 Passo 2 (Avatar + Voz) será implementado na Task 6</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeyGenSetupWizardDemo;
