import React from "react";
import { showLoading, dismissToast, showError } from "@/utils/toast";

type Props = {
  initial?: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
  } | null;
  onSave: (descriptions: { instagram: string; tiktok: string; facebook: string }) => Promise<any>;
  onBack?: () => void;
};

const LIMITS = {
  instagram: 2200,
  tiktok: 2200,
  facebook: 5000,
};

const generateMock = (platform: string) => {
  if (platform === "instagram") return "Descrição gerada por IA (mock) para Instagram...";
  if (platform === "tiktok") return "Descrição gerada por IA (mock) para TikTok...";
  return "Descrição gerada por IA (mock) para Facebook...";
};

const DescriptionEditor: React.FC<Props> = ({ initial, onSave, onBack }) => {
  const [instagram, setInstagram] = React.useState(initial?.instagram ?? "");
  const [tiktok, setTiktok] = React.useState(initial?.tiktok ?? "");
  const [facebook, setFacebook] = React.useState(initial?.facebook ?? "");
  const [saving, setSaving] = React.useState(false);

  const valid =
    instagram.trim().length > 0 &&
    instagram.length <= LIMITS.instagram &&
    tiktok.trim().length > 0 &&
    tiktok.length <= LIMITS.tiktok &&
    facebook.trim().length > 0 &&
    facebook.length <= LIMITS.facebook;

  const handleRegenerate = async (platform: string) => {
    const toastId = showLoading("Regenerating...");
    // Mock: replace with different mock content
    setTimeout(() => {
      dismissToast(toastId);
      if (platform === "instagram") setInstagram(generateMock(platform) + " (v2)");
      if (platform === "tiktok") setTiktok(generateMock(platform) + " (v2)");
      if (platform === "facebook") setFacebook(generateMock(platform) + " (v2)");
    }, 800);
  };

  const handleSave = async () => {
    if (!valid) {
      showError("Verifique as descrições (formatos/limites)");
      return;
    }
    setSaving(true);
    const res = await onSave({ instagram, tiktok, facebook });
    setSaving(false);
    return res;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Instagram</h3>
            <div className="text-xs text-slate-500">Limite: {LIMITS.instagram} caracteres</div>
          </div>
          <div className="text-xs text-slate-400">{instagram.length}/{LIMITS.instagram}</div>
        </div>
        <textarea value={instagram} onChange={(e) => setInstagram(e.target.value)} rows={6} className="w-full mt-3 rounded border p-2" />
        <div className="flex justify-end mt-2">
          <button onClick={() => handleRegenerate("instagram")} className="px-3 py-1 rounded bg-gray-100 text-sm">🔄 Regerar</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">TikTok</h3>
            <div className="text-xs text-slate-500">Limite: {LIMITS.tiktok} caracteres</div>
          </div>
          <div className="text-xs text-slate-400">{tiktok.length}/{LIMITS.tiktok}</div>
        </div>
        <textarea value={tiktok} onChange={(e) => setTiktok(e.target.value)} rows={5} className="w-full mt-3 rounded border p-2" />
        <div className="flex justify-end mt-2">
          <button onClick={() => handleRegenerate("tiktok")} className="px-3 py-1 rounded bg-gray-100 text-sm">🔄 Regerar</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Facebook</h3>
            <div className="text-xs text-slate-500">Limite: {LIMITS.facebook} caracteres</div>
          </div>
          <div className="text-xs text-slate-400">{facebook.length}/{LIMITS.facebook}</div>
        </div>
        <textarea value={facebook} onChange={(e) => setFacebook(e.target.value)} rows={7} className="w-full mt-3 rounded border p-2" />
        <div className="flex justify-end mt-2">
          <button onClick={() => handleRegenerate("facebook")} className="px-3 py-1 rounded bg-gray-100 text-sm">🔄 Regerar</button>
        </div>
      </div>

      <div className="flex justify-between">
        <div>
          <button onClick={onBack} className="px-3 py-1 rounded bg-gray-100">← Voltar</button>
        </div>
        <div>
          <button onClick={handleSave} disabled={!valid || saving} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">
            {saving ? "Salvando..." : "💾 Salvar Vídeo"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DescriptionEditor;