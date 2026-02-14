import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import ProfileSelector from "@/components/onboarding/ProfileSelector";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import SocialAccountCard from "@/components/settings/SocialAccountCard";
import { useEffect, useState } from "react";

/**
 * Types
 */
type SocialAccount = {
  platform: string;
  connected: boolean;
  accountName?: string | null;
};

const SOCIAL_PLATFORMS: Array<SocialAccount["platform"]> = [
  "linkedin",
  "x",
  "instagram",
  "tiktok",
  "facebook",
  "youtube",
];

/**
 * Settings page
 */
const Settings: React.FC = () => {
  const { user } = useAuth();
  const orgId = user?.organization_id;
  const [profiles, setProfiles] = React.useState<string[]>((user as any)?.organization?.user_profiles ?? []);
  const [saving, setSaving] = React.useState(false);

  // Social accounts state
  const [socialAccounts, setSocialAccounts] = useState<Record<string, SocialAccount>>({});
  const [socialLoading, setSocialLoading] = useState<Record<string, boolean>>({});

  // HeyGen state
  const [heygenApiKey, setHeygenApiKey] = useState<string>("");
  const [heygenAvatarId, setHeygenAvatarId] = useState<string>("");
  const [heygenVoiceId, setHeygenVoiceId] = useState<string>("");
  const [heygenTesting, setHeygenTesting] = useState(false);
  const [heygenSaving, setHeygenSaving] = useState(false);
  const [heygenTestResult, setHeygenTestResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [heygenCredits, setHeygenCredits] = useState<{ used: number; total: number } | null>(null);

  useEffect(() => {
    setProfiles((user as any)?.organization?.user_profiles ?? []);
  }, [user?.organization?.user_profiles]);

  // Load social accounts and heygen credits on mount
  useEffect(() => {
    async function load() {
      // Social accounts
      try {
        const res = await fetch("/api/integrations/social-accounts");
        if (res.ok) {
          const data = await res.json();
          // Expecting array: [{ platform, connected, accountName }]
          const map: Record<string, SocialAccount> = {};
          (data ?? []).forEach((s: any) => {
            map[s.platform] = { platform: s.platform, connected: !!s.connected, accountName: s.accountName ?? null };
          });
          // ensure all platforms present
          SOCIAL_PLATFORMS.forEach((p) => {
            if (!map[p]) map[p] = { platform: p, connected: false, accountName: null };
          });
          setSocialAccounts(map);
        } else {
          // fallback: init defaults
          const map: Record<string, SocialAccount> = {};
          SOCIAL_PLATFORMS.forEach((p) => {
            map[p] = { platform: p, connected: false, accountName: null };
          });
          setSocialAccounts(map);
        }
      } catch (e) {
        const map: Record<string, SocialAccount> = {};
        SOCIAL_PLATFORMS.forEach((p) => {
          map[p] = { platform: p, connected: false, accountName: null };
        });
        setSocialAccounts(map);
      }

      // HeyGen credits
      try {
        const res2 = await fetch("/api/integrations/heygen/credits");
        if (res2.ok) {
          const j = await res2.json();
          setHeygenCredits({ used: j.used ?? 0, total: j.total ?? 0 });
        } else {
          setHeygenCredits(null);
        }
      } catch {
        setHeygenCredits(null);
      }
    }
    load();
  }, []);

  const saveProfiles = async () => {
    if (!orgId) {
      showError("Organização não encontrada");
      return;
    }
    setSaving(true);
    const toastId = showLoading("Salvando perfis...");
    try {
      const res: any = await (supabase.from("organizations") as any)
        .update({
          user_profiles: profiles,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orgId)
        .select()
        .single();
      dismissToast(toastId);
      if (res?.error) {
        showError("Erro ao salvar perfis");
      } else {
        showSuccess("Perfis atualizados!");
      }
    } catch (err: any) {
      dismissToast(toastId);
      showError("Erro ao salvar perfis");
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async (platform: string) => {
    setSocialLoading((s) => ({ ...s, [platform]: true }));
    try {
      const res = await fetch("/api/integrations/social-accounts/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (res.ok) {
        const j = await res.json();
        // If backend returns an OAuth redirect URL, navigate there
        if (j?.redirectUrl) {
          window.location.href = j.redirectUrl;
          return;
        }
        // Otherwise, simulate connected
        setSocialAccounts((prev) => ({
          ...prev,
          [platform]: { platform, connected: true, accountName: j?.accountName ?? `@${platform}` },
        }));
        showSuccess(`${platform} conectado`);
      } else {
        const err = await res.text();
        showError(err || "Falha ao iniciar conexão");
      }
    } catch (e: any) {
      console.error(e);
      showError("Erro ao conectar");
    } finally {
      setSocialLoading((s) => ({ ...s, [platform]: false }));
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm("Tem certeza que deseja desconectar esta conta?")) return;
    setSocialLoading((s) => ({ ...s, [platform]: true }));
    try {
      const res = await fetch(`/api/integrations/social-accounts/${platform}`, { method: "DELETE" });
      if (res.ok) {
        setSocialAccounts((prev) => ({
          ...prev,
          [platform]: { platform, connected: false, accountName: null },
        }));
        showSuccess("Conta desconectada");
      } else {
        const err = await res.text();
        showError(err || "Falha ao desconectar");
      }
    } catch (e) {
      console.error(e);
      showError("Erro ao desconectar");
    } finally {
      setSocialLoading((s) => ({ ...s, [platform]: false }));
    }
  };

  const handleHeygenTest = async () => {
    if (!heygenApiKey || heygenApiKey.trim() === "") {
      showError("API Key do HeyGen não pode estar vazia");
      return;
    }
    setHeygenTesting(true);
    setHeygenTestResult(null);
    try {
      const res = await fetch("/api/integrations/heygen/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: heygenApiKey,
          avatarId: heygenAvatarId || undefined,
          voiceId: heygenVoiceId || undefined,
        }),
      });
      const j = await res.json();
      if (res.ok && j?.success) {
        setHeygenTestResult({ ok: true, message: "Conexão válida!" });
        showSuccess("Conexão HeyGen válida!");
        // refresh credits
        try {
          const cRes = await fetch("/api/integrations/heygen/credits");
          if (cRes.ok) {
            const cj = await cRes.json();
            setHeygenCredits({ used: cj.used ?? 0, total: cj.total ?? 0 });
          }
        } catch {}
      } else {
        setHeygenTestResult({ ok: false, message: j?.message ?? "Erro na conexão" });
        showError(j?.message ?? "Erro ao testar HeyGen");
      }
    } catch (e: any) {
      console.error(e);
      setHeygenTestResult({ ok: false, message: "Erro ao testar conexão" });
      showError("Erro ao testar HeyGen");
    } finally {
      setHeygenTesting(false);
    }
  };

  const handleHeygenSave = async () => {
    setHeygenSaving(true);
    const toastId = showLoading("Salvando HeyGen...");
    try {
      const res = await fetch("/api/integrations/heygen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: heygenApiKey,
          avatarId: heygenAvatarId || null,
          voiceId: heygenVoiceId || null,
        }),
      });
      if (res.ok) {
        dismissToast(toastId);
        showSuccess("Configuração HeyGen salva!");
      } else {
        const err = await res.text();
        dismissToast(toastId);
        showError(err || "Erro ao salvar configuração");
      }
    } catch (e) {
      dismissToast(toastId);
      console.error(e);
      showError("Erro ao salvar HeyGen");
    } finally {
      setHeygenSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-xl font-semibold">Settings</h2>

        {/* Profile (unchanged) */}
        <section className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Perfil</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600">Nome</label>
              <input defaultValue={user?.full_name ?? ""} className="mt-1 w-full rounded-md border p-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-600">Email</label>
              <input defaultValue={user?.email ?? ""} disabled className="mt-1 w-full rounded-md border p-2 bg-slate-50" />
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-2">Perfis Profissionais</h4>
            <p className="text-sm text-slate-500 mb-3">Selecione os perfis que descrevem sua atuação — isso personaliza scripts e sugestões.</p>
            <ProfileSelector value={profiles} onChange={setProfiles} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setProfiles((user as any)?.organization?.user_profiles ?? []); }} className="px-3 py-1 rounded bg-gray-100">Cancelar</button>
              <button onClick={saveProfiles} disabled={saving} className="px-4 py-2 rounded bg-indigo-600 text-white">{saving ? "Salvando..." : "Salvar Alterações"}</button>
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Integrações</h3>

          {/* Social Accounts */}
          <div className="mt-4">
            <h4 className="font-medium mb-2">Redes Sociais Conectadas</h4>
            <p className="text-sm text-slate-500 mb-3">Conecte suas contas de redes sociais para publicar automaticamente via RENUM.</p>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SOCIAL_PLATFORMS.map((p) => {
                const s = socialAccounts[p] ?? { platform: p, connected: false, accountName: null };
                return (
                  <SocialAccountCard
                    key={p}
                    platform={p as any}
                    isConnected={s.connected}
                    accountName={s.accountName}
                    connecting={!!socialLoading[p]}
                    onConnect={() => handleConnect(p)}
                    onDisconnect={() => handleDisconnect(p)}
                  />
                );
              })}
            </div>
          </div>

          {/* HeyGen */}
          <div className="mt-6">
            <h4 className="font-medium mb-2">Avatar AI — HeyGen</h4>
            <p className="text-sm text-slate-500 mb-3">Configure sua conta HeyGen para gerar vídeos com seu avatar digital.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600">API Key</label>
                <div className="mt-1 relative">
                  <input
                    type="password"
                    value={heygenApiKey}
                    onChange={(e) => setHeygenApiKey(e.target.value)}
                    className="w-full rounded-md border p-2"
                    placeholder="********"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-600">Avatar ID</label>
                <input value={heygenAvatarId} onChange={(e) => setHeygenAvatarId(e.target.value)} className="mt-1 w-full rounded-md border p-2" />
              </div>

              <div>
                <label className="block text-sm text-slate-600">Voice ID</label>
                <input value={heygenVoiceId} onChange={(e) => setHeygenVoiceId(e.target.value)} className="mt-1 w-full rounded-md border p-2" />
              </div>

              <div className="flex items-end">
                <div className="w-full">
                  <div className="flex gap-2">
                    <button onClick={handleHeygenTest} disabled={heygenTesting} className="px-3 py-2 rounded bg-indigo-600 text-white">
                      {heygenTesting ? "Testando..." : "Testar Conexão"}
                    </button>
                    <button onClick={handleHeygenSave} disabled={heygenSaving} className="px-3 py-2 rounded bg-gray-100">
                      {heygenSaving ? "Salvando..." : "Salvar Configuração"}
                    </button>
                  </div>

                  {heygenTestResult && (
                    <div className={`mt-3 inline-flex items-center gap-2 text-sm ${heygenTestResult.ok ? "text-green-700" : "text-red-600"}`}>
                      {heygenTestResult.ok ? "✅ Conexão válida!" : `❌ ${heygenTestResult.message ?? "Falha na conexão"}`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">Créditos HeyGen</div>
                  <div className="text-sm">{heygenCredits ? `${heygenCredits.used}/${heygenCredits.total}` : "—"}</div>
                </div>
                <div className="w-1/2">
                  <div className="w-full bg-slate-100 h-3 rounded overflow-hidden">
                    <div
                      className="h-3 bg-indigo-600 transition-all"
                      style={{ width: `${heygenCredits ? Math.min(100, (heygenCredits.used / Math.max(1, heygenCredits.total)) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <button onClick={() => alert("Como obter essas informações? (modal futuro)")} className="text-sm text-indigo-600 underline">
                  Como obter essas informações?
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Plan (unchanged) */}
        <section className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Plano</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded">Plano atual: <span className="font-semibold">{(user?.organization?.plan ?? "—").toString().toUpperCase()}</span></div>
            <div className="p-4 border rounded">Vídeos restantes: 3/3</div>
            <div className="p-4 border rounded"><button disabled className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-50">Ver planos</button></div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Settings;