import React from "react";

type Props = {
  createScript: () => void;
  theme: string;
  setTheme: (v: string) => void;
  audience: string;
  setAudience: (v: string) => void;
  loading?: boolean;
};

const audiences = [
  {
    value: "mlm",
    label: "Consultoras de Vendas Diretas",
    description: "Foco: Vendas, produtos, dicas comerciais",
    icon: "💼",
  },
  {
    value: "politics",
    label: "Profissionais Políticos",
    description: "Foco: Políticas públicas, propostas, comunidade",
    icon: "🏛️",
  },
  {
    value: "general",
    label: "Geral",
    description: "Foco: Informação geral, engajamento amplo",
    icon: "🌐",
  },
];

const ThemeInput: React.FC<Props> = ({ createScript, theme, setTheme, audience, setAudience, loading = false }) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const isValid = theme.trim().length >= 10;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">PASSO 1: Escolha o Tema</h3>
        <p className="text-sm text-slate-500 mt-1">Sobre o que será o vídeo? Seja específico para melhores resultados.</p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">Tema</label>
          <textarea
            placeholder="Ex: Benefícios da vitamina D para a pele"
            maxLength={200}
            rows={3}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            autoFocus
            className="mt-2 w-full rounded border p-2"
          />
          <div className="text-xs text-slate-400 mt-1">{theme.length}/200 caracteres</div>
          {!isValid && theme.length > 0 && (
            <p className="text-sm text-red-500 mt-2">Mínimo 10 caracteres ({theme.length}/10)</p>
          )}
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium">Público-alvo</div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
            {audiences.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAudience(a.value)}
                className={`p-3 rounded-lg border text-left transition ${audience === a.value ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{a.icon}</div>
                  <div>
                    <div className="font-medium">{a.label}</div>
                    <div className="text-xs text-slate-500">{a.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <button type="button" onClick={() => setShowAdvanced((s) => !s)} className="text-sm text-slate-600 underline">
            {showAdvanced ? "Ocultar" : "Mostrar"} Configurações Avançadas
          </button>

          {showAdvanced && (
            <div className="mt-3 border rounded p-3 bg-slate-50">
              <div className="text-sm">Duração (opcional)</div>
              <div className="mt-2 flex gap-2">
                <button className="px-3 py-1 rounded bg-gray-100">Curto (30-60s)</button>
                <button className="px-3 py-1 rounded bg-indigo-600 text-white">Médio (60-90s)</button>
                <button className="px-3 py-1 rounded bg-gray-100">Longo (90-120s)</button>
              </div>
              <div className="mt-3 text-sm">Tom de voz</div>
              <div className="mt-2 flex gap-2">
                <button className="px-3 py-1 rounded bg-gray-100">Inspirador</button>
                <button className="px-3 py-1 rounded bg-indigo-600 text-white">Educativo</button>
                <button className="px-3 py-1 rounded bg-gray-100">Urgente</button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button onClick={() => window.history.back()} className="px-3 py-2 rounded bg-gray-100">Cancelar</button>
          <button
            onClick={() => createScript()}
            disabled={loading || !isValid}
            className={`px-4 py-2 rounded ${loading || !isValid ? "bg-indigo-200 text-white cursor-not-allowed" : "bg-indigo-600 text-white"}`}
          >
            {loading ? "Processando..." : "🔍 Criar Script →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeInput;