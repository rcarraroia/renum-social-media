import React from "react";
import { showLoading, dismissToast, showError } from "@/utils/toast";

type Props = {
  platforms: Array<{ key: string; label: string }>;
  initial?: Record<string, string> | null;
  onSave: (descriptions: Record<string, string>) => Promise<any>;
  onBack?: () => void;
};

const PLATFORM_LIMITS: Record<string, number> = {
  linkedin: 3000,
  x: 280,
  instagram: 2200,
  tiktok: 2200,
  facebook: 63206,
  youtube: 5000,
};

const DEFAULT_LIMIT = 2200;

const generateMock = (platform: string) => {
  return `Descrição gerada por IA (mock) para ${platform}`;
};

const DescriptionEditor: React.FC<Props> = ({ platforms = [], initial, onSave, onBack }) => {
  const initialState = React.useMemo(() => {
    const obj: Record<string, string> = {};
    platforms.forEach((p) => {
      obj[p.key] = initial?.[p.key] ?? "";
    });
    return obj;
  }, [platforms, initial]);

  const [values, setValues] = React.useState<Record<string, string>>(initialState);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setValues(initialState);
  }, [initialState]);

  const handleRegenerate = async (platformKey: string) => {
    const toastId = showLoading("Regenerating...");
    // Mock: generate
    setTimeout(() => {
      setValues((prev) => ({ ...prev, [platformKey]: generateMock(platformKey) + " (v2)" }));
      dismissToast(toastId);
    }, 700);
  };

  const handleSave = async () => {
    // validation: ensure char limits are respected
    const violations = platforms.filter((p) => (values[p.key]?.length ?? 0) > (PLATFORM_LIMITS[p.key] ?? DEFAULT_LIMIT));
    if (violations.length > 0) {
      showError(`Algumas descrições excedem o limite: ${violations.map((v) => v.label).join(", ")}`);
      return;
    }
    setSaving(true);
    const res = await onSave(values);
    setSaving(false);
    return res;
  };

  return (
    <div className="space-y-4">
      {platforms.length === 0 && (
        <div className="bg-yellow-50 p-4 rounded text-sm">Conecte pelo menos uma rede social em Configurações para gerar descrições</div>
      )}

      {platforms.map((p) => {
        const limit = PLATFORM_LIMITS[p.key] ?? DEFAULT_LIMIT;
        const text = values[p.key] ?? "";
        const over = text.length > limit;
        return (
          <div key={p.key} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium">{p.label}</div>
                <div className="text-xs text-slate-500">Limite: {limit} caracteres</div>
              </div>
              <div className={`text-xs ${over ? "text-red-600" : "text-slate-400"}`}>{text.length}/{limit}</div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setValues((s) => ({ ...(s ?? {}), [p.key]: e.target.value }))}
              rows={Math.max(3, Math.min(8, Math.ceil((text.length || 1) / 120)))}
              className="w-full mt-3 rounded border p-2"
            />

            <div className="flex justify-end mt-2 gap-2">
              <button onClick={() => handleRegenerate(p.key)} className="px-3 py-1 rounded bg-gray-100 text-sm">🔄 Regerar</button>
            </div>
          </div>
        );
      })}

      <div className="flex justify-between">
        <div>
          {onBack && <button onClick={onBack} className="px-3 py-1 rounded bg-gray-100">← Voltar</button>}
        </div>
        <div>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60">
            {saving ? "Salvando..." : "💾 Salvar Vídeo"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DescriptionEditor;