import React from "react";

type Props = {
  script: string;
  audience?: string;
  onRegenerate: (feedback?: string) => void;
  onApprove: () => void;
  onEditScript: (s: string) => void;
  loading?: boolean;
};

function countWords(text: string) {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

function estimateSeconds(text: string) {
  const words = countWords(text);
  return Math.round(words * 0.5); // 0.5s per word
}

const ScriptPreview: React.FC<Props> = ({ script, audience, onRegenerate, onApprove, onEditScript, loading }) => {
  const [editing, setEditing] = React.useState(false);
  const [localScript, setLocalScript] = React.useState(script ?? "");

  React.useEffect(() => {
    setLocalScript(script ?? "");
  }, [script]);

  const words = countWords(localScript);
  const seconds = estimateSeconds(localScript);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localScript);
      // minimal feedback (could use toast)
      // eslint-disable-next-line no-alert
      alert("Script copiado!");
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">PASSO 2: Revisar o Script</h3>
            <p className="text-sm text-slate-500">Revise ou edite antes de escolher sua jornada.</p>
          </div>

          <div className="text-sm text-slate-400">
            <div>Palavras: {words}</div>
            <div>Duração: {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}</div>
            <div>Público: {audience ?? "—"}</div>
          </div>
        </div>

        <div className="mt-4 relative">
          <div className="absolute right-3 top-3">
            <button title="Copiar" onClick={handleCopy} className="text-sm text-slate-600 bg-slate-100 p-1 rounded">
              📋
            </button>
          </div>

          {!editing ? (
            <div className="whitespace-pre-wrap text-slate-800 min-h-[200px]">{localScript || "Nenhum script gerado ainda."}</div>
          ) : (
            <textarea value={localScript} onChange={(e) => setLocalScript(e.target.value)} rows={8} className="w-full rounded border p-2 min-h-[200px]" />
          )}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="space-x-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="px-3 py-1 rounded bg-gray-100">✏️ Editar</button>
            ) : (
              <>
                <button onClick={() => { setEditing(false); setLocalScript(script ?? ""); }} className="px-3 py-1 rounded bg-gray-100">Cancelar</button>
                <button onClick={() => { setEditing(false); onEditScript(localScript); }} className="px-3 py-1 rounded bg-indigo-600 text-white">Salvar</button>
              </>
            )}

            <button onClick={() => onRegenerate()} disabled={!!loading} className="px-3 py-1 rounded bg-gray-100">🔄 Regerar</button>
          </div>

          <div>
            <button onClick={() => onApprove()} className="px-4 py-2 rounded bg-green-600 text-white">✅ Aprovar Script</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptPreview;