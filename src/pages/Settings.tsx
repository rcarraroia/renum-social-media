import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import ProfileSelector from "@/components/onboarding/ProfileSelector";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import SocialAccountCard from "../components/settings/SocialAccountCard";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

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
  const [profiles, setProfiles] = React.useState<string[]>((user as any)?.organization?.professional_profiles ?? []);
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
    setProfiles((user as any)?.organization?.professional_profiles ?? []);
  }, [user?.organization?.professional_profiles]);

  // Load social accounts and heygen credits on mount
  useEffect(() => {
    async function load() {
      // Social accounts via API client
      try {
        const data = await api.social.listAccounts();
        const map: Record<string, SocialAccount> = {};
        (data.accounts ?? []).forEach((s) => {
          map[s.platform] = { platform: s.platform, connected: !!s.connected, accountName: s.account_name ?? null };
        });
        // ensure all platforms present
        SOCIAL_PLATFORMS.forEach((p) => {
          if (!map[p]) map[p] = { platform: p, connected: false, accountName: null };
        });
        setSocialAccounts(map);
      } catch (e) {
        console.error("Erro ao carregar contas sociais:", e);
        const map: Record<string, SocialAccount> = {};
        SOCIAL_PLATFORMS.forEach((p) => {
          map[p] = { platform: p, connected: false, accountName: null };
        });
        setSocialAccounts(map);
      }

      // HeyGen credits via API client
      try {
        const credits = await api.heygen.getCredits();
        setHeygenCredits({ used: 0, total: credits.remaining_credits }); // Ajustar conforme estrutura real
      } catch (e) {
        console.error("Erro ao carregar créditos HeyGen:", e);
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
          professional_profiles: profiles,
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
      const response = await api.social.connect(platform);
      
      // Se backend retorna URL de OAuth, abrir em nova janela
      if (response?.authorization_url) {
        const authWindow = window.open(response.authorization_url, '_blank', 'width=600,height=700');
        
        // Implementar polling para verificar quando OAuth completar
        const pollInterval = setInterval(async () => {
          try {
            const updatedAccounts = await api.social.listAccounts();
            const account = updatedAccounts.accounts.find(a => a.platform === platform);
            
            if (account?.connected) {
              clearInterval(pollInterval);
              if (authWindow) authWindow.close();
              
              setSocialAccounts((prev) => ({
                ...prev,
                [platform]: { platform, connected: true, accountName: account.account_name ?? `@${platform}` },
              }));
              showSuccess(`${platform} conectado com sucesso!`);
              setSocialLoading((s) => ({ ...s, [platform]: false }));
            }
          } catch (pollErr) {
            console.error("Erro ao verificar status de conexão:", pollErr);
          }
        }, 3000); // Poll a cada 3 segundos
        
        // Timeout após 5 minutos
        setTimeout(() => {
          clearInterval(pollInterval);
          setSocialLoading((s) => ({ ...s, [platform]: false }));
        }, 300000);
      }
    } catch (e: any) {
      console.error("Erro ao conectar:", e);
      showError(e?.message ?? "Erro ao conectar");
      setSocialLoading((s) => ({ ...s, [platform]: false }));
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm("Tem certeza que deseja desconectar esta conta?")) return;
    setSocialLoading((s) => ({ ...s, [platform]: true }));
    try {
      await api.social.disconnect(platform);
      setSocialAccounts((prev) => ({
        ...prev,
        [platform]: { platform, connected: false, accountName: null },
      }));
      showSuccess("Conta desconectada");
    } catch (e: any) {
      console.error("Erro ao desconectar:", e);
      showError(e?.message ?? "Erro ao desconectar");
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
      const response = await api.heygen.test();
      if (response.success) {
        setHeygenTestResult({ ok: true, message: response.message ?? "Conexão válida!" });
        showSuccess("Conexão HeyGen válida!");
        // refresh credits
        try {
          const credits = await api.heygen.getCredits();
          setHeygenCredits({ used: 0, total: credits.remaining_credits });
        } catch {}
      } else {
        setHeygenTestResult({ ok: false, message: response.message ?? "Erro na conexão" });
        showError(response.message ?? "Erro ao testar HeyGen");
      }
    } catch (e: any) {
      console.error("Erro ao testar HeyGen:", e);
      setHeygenTestResult({ ok: false, message: e?.message ?? "Erro ao testar conexão" });
      showError(e?.message ?? "Erro ao testar HeyGen");
    } finally {
      setHeygenTesting(false);
    }
  };

  const handleHeygenSave = async () => {
    setHeygenSaving(true);
    const toastId = showLoading("Salvando HeyGen...");
    try {
      const response = await api.heygen.configure({
        api_key: heygenApiKey,
        avatar_id: heygenAvatarId || undefined,
        voice_id: heygenVoiceId || undefined,
      });
      
      dismissToast(toastId);
      if (response.success) {
        showSuccess("Configuração HeyGen salva!");
      } else {
        showError(response.message ?? "Erro ao salvar configuração");
      }
    } catch (e: any) {
      dismissToast(toastId);
      console.error("Erro ao salvar HeyGen:", e);
      showError(e?.message ?? "Erro ao salvar HeyGen");
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
              <button onClick={() => { setProfiles((user as any)?.organization?.professional_profiles ?? []); }} className="px-3 py-1 rounded bg-gray-100">Cancelar</button>
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