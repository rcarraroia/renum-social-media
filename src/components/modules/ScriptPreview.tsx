import React from "react";

type Props = {
  script: string;
  onRegenerate: (feedback?: string) => void;
  onApprove: () => void;
  onEditScript: (s: string) => void;
  loading?: boolean;
};

const countWords = (text: string) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

const estimateDuration = (text: string) => {
  const words = countWords(text);
  const totalSeconds = Math.round(words * 0.5); // 0.5 seconds per word (spec)
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const ScriptPreview: React.FC<Props> = ({ script, onRegenerate, onApprove, onEditScript, loading }) => {
  const [editing, setEditing] = React.useState(false);
  const [localScript, setLocalScript] = React.useState(script ?? "");

  React.useEffect(() => {
    setLocalScript(script ?? "");
  }, [script]);

  const wordCount = countWords(localScript);
  const duration = estimateDuration(localScript);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">PASSO 2: Preview do Script</h3>
            <p className="text-sm text-slate-500">Revise, edite ou regenere o script antes de aprovar.</p>
          </div>
          <div className="text-sm text-slate-400">Palavras: {wordCount} • Duração: {duration}</div>
        </div>

        <div className="mt-4">
          {!editing ? (
            <div className="prose max-w-none whitespace-pre-wrap text-slate-800">{localScript || "Nenhum script gerado ainda."}</div>
          ) : (
            <textarea value={localScript} onChange={(e) => setLocalScript(e.target.value)} rows={12} className="w-full rounded border p-2" />
          )}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="space-x-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="px-3 py-1 rounded bg-gray-100">✏️ Editar Script</button>
            ) : (
              <>
                <button onClick={() => { setEditing(false); setLocalScript(script ?? ""); }} className="px-3 py-1 rounded bg-gray-100">Cancelar</button>
                <button onClick={() => { setEditing(false); onEditScript(localScript); }} className="px-3 py-1 rounded bg-indigo-600 text-white">Salvar</button>
              </>
            )}

            <button onClick={() => onRegenerate()} disabled={loading} className="px-3 py-1 rounded bg-gray-100">🔄 Regerar</button>
          </div>

          <div>
            <button onClick={() => { onApprove(); }} className="px-4 py-2 rounded bg-green-600 text-white">✅ Aprovar e Continuar</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-slate-600 mb-2">Fontes utilizadas</div>
        <ul className="text-sm text-slate-700 list-disc pl-5">
          <li>Sociedade Brasileira de Dermatologia (exemplo)</li>
          <li>PubMed - Vitamin D and Skin Health (exemplo)</li>
        </ul>
      </div>
    </div>
  );
};

export default ScriptPreview;