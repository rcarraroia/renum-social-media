import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import ProfileSelector from "@/components/onboarding/ProfileSelector";
import MainLayout from "@/components/layout/MainLayout";
import SocialAccountCard from "../components/settings/SocialAccountCard";

/**
 * Onboarding restructured:
 * Step 1: Profile (name + profile selector)
 * Step 2: Connect Socials (can skip)
 * Step 3: HeyGen config (only for Pro)
 * Step 4: Done
 */

const SOCIAL_PLATFORMS = ["linkedin", "x", "instagram", "tiktok", "facebook", "youtube"];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<number>(1);

  // Step 1
  const [fullName, setFullName] = useState<string>(user?.full_name ?? "");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>((user as any)?.organization?.professional_profiles ?? []);
  const [audience, setAudience] = useState<string>("general");

  // Step 2 social connections
  const [socialAccounts, setSocialAccounts] = useState<Record<string, { connected: boolean; accountName?: string | null }>>({});
  const [socialLoading, setSocialLoading] = useState<Record<string, boolean>>({});

  // Step 3 HeyGen
  const [heygenApiKey, setHeygenApiKey] = useState("");
  const [heygenAvatarId, setHeygenAvatarId] = useState("");
  const [heygenVoiceId, setHeygenVoiceId] = useState("");
  const [heygenTesting, setHeygenTesting] = useState(false);
  const [heygenConfigured, setHeygenConfigured] = useState(false);

  const orgId = user?.organization_id;
  const userId = user?.id;

  // Função helper para atualizar step e persistir no banco
  const updateStep = async (newStep: number) => {
    setStep(newStep);
    
    if (!orgId) return;
    
    try {
      await supabase
        .from("organizations")
        .update({ onboarding_step: newStep })
        .eq("id", orgId);
    } catch (err) {
      console.error("Erro ao salvar progresso:", err);
    }
  };

  // Restaurar progresso do onboarding ao carregar
  useEffect(() => {
    async function restoreProgress() {
      if (!orgId) return;
      
      try {
        const res: any = await supabase
          .from("organizations")
          .select("onboarding_step, professional_profiles")
          .eq("id", orgId)
          .single();
        
        if (res?.data) {
          const savedStep = res.data.onboarding_step || 1;
          setStep(savedStep);
          
          // Restaurar perfis se já foram salvos
          if (res.data.professional_profiles && res.data.professional_profiles.length > 0) {
            setSelectedProfiles(res.data.professional_profiles);
          }
        }
      } catch (err) {
        console.error("Erro ao restaurar progresso:", err);
      }
    }
    
    restoreProgress();
  }, [orgId]);

  useEffect(() => {
    // init social account states (fetch from API or fallback)
    async function loadSocial() {
      try {
        const res = await fetch("/api/integrations/social-accounts");
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, any> = {};
          (data ?? []).forEach((s: any) => {
            map[s.platform] = { connected: !!s.connected, accountName: s.accountName ?? null };
          });
          SOCIAL_PLATFORMS.forEach((p) => {
            if (!map[p]) map[p] = { connected: false, accountName: null };
          });
          setSocialAccounts(map);
        } else {
          const map: Record<string, any> = {};
          SOCIAL_PLATFORMS.forEach((p) => (map[p] = { connected: false, accountName: null }));
          setSocialAccounts(map);
        }
      } catch {
        const map: Record<string, any> = {};
        SOCIAL_PLATFORMS.forEach((p) => (map[p] = { connected: false, accountName: null }));
        setSocialAccounts(map);
      }
    }
    loadSocial();
  }, []);

  const saveProfilesToOrg = async (): Promise<boolean> => {
    if (!orgId) {
      showError("Organização não encontrada");
      return false;
    }
    try {
      const toastId = showLoading("Salvando perfis...");
      
      const res: any = await (supabase.from("organizations") as any)
        .update({
          professional_profiles: selectedProfiles,
          onboarding_step: 2, // Avançar para passo 2
          updated_at: new Date().toISOString(),
        })
        .eq("id", orgId)
        .select()
        .single();
      
      dismissToast(toastId);
      if (res?.error) {
        console.error("[DEBUG] Erro do Supabase:", res.error);
        showError(`Erro ao salvar perfis: ${res.error.message || JSON.stringify(res.error)}`);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[DEBUG] Exception ao salvar:", err);
      showError("Erro ao salvar perfis");
      return false;
    }
  };

  const connectSocial = async (platform: string) => {
    setSocialLoading((s) => ({ ...s, [platform]: true }));
    try {
      const res = await fetch("/api/integrations/social-accounts/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (res.ok) {
        const j = await res.json();
        if (j?.redirectUrl) {
          window.location.href = j.redirectUrl;
          return;
        }
        setSocialAccounts((prev) => ({ ...prev, [platform]: { connected: true, accountName: j?.accountName ?? `@${platform}` } }));
        showSuccess(`${platform} conectado`);
      } else {
        const err = await res.text();
        showError(err || "Falha ao conectar");
      }
    } catch (e) {
      console.error(e);
      showError("Erro ao conectar");
    } finally {
      setSocialLoading((s) => ({ ...s, [platform]: false }));
    }
  };

  const disconnectSocial = async (platform: string) => {
    if (!confirm("Tem certeza que deseja desconectar esta conta?")) return;
    setSocialLoading((s) => ({ ...s, [platform]: true }));
    try {
      const res = await fetch(`/api/integrations/social-accounts/${platform}`, { method: "DELETE" });
      if (res.ok) {
        setSocialAccounts((prev) => ({ ...prev, [platform]: { connected: false, accountName: null } }));
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
    try {
      const res = await fetch("/api/integrations/heygen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          api_key: heygenApiKey, 
          avatar_id: heygenAvatarId || undefined, 
          voice_id: heygenVoiceId || undefined 
        }),
      });
      const j = await res.json();
      if (res.ok && j?.success) {
        setHeygenConfigured(true);
        showSuccess("Conexão HeyGen válida!");
      } else {
        setHeygenConfigured(false);
        showError(j?.detail || j?.message || "Falha ao testar HeyGen");
      }
    } catch (e) {
      console.error(e);
      showError("Erro ao testar HeyGen");
    } finally {
      setHeygenTesting(false);
    }
  };

  const handleCompleteProfiles = async () => {
    if (!userId) {
      showError("Usuário não encontrado");
      return;
    }
    if (!selectedProfiles || selectedProfiles.length === 0) {
      showError("Selecione ao menos um perfil");
      return;
    }

    const ok = await saveProfilesToOrg();
    if (!ok) return;

    await updateStep(2);
  };

  const finishOnboarding = () => {
    showSuccess("Onboarding finalizado!");
    navigate("/dashboard");
  };

  const userPlan = (user?.organization?.plan as "free" | "starter" | "pro") ?? "free";

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 flex items-start justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6">
          {/* Stepper */}
          <div className="mb-6">
            <div className="flex gap-2 items-center overflow-auto">
              <div className={`px-3 py-1 rounded ${step === 1 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>1. Perfil</div>
              <div className={`px-3 py-1 rounded ${step === 2 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>2. Conectar Redes</div>
              <div className={`px-3 py-1 rounded ${step === 3 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>3. Avatar AI</div>
              <div className={`px-3 py-1 rounded ${step === 4 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>4. Pronto</div>
            </div>
          </div>

          {/* Step content */}
          {step === 1 && (
            <div>
              <h3 className="text-xl font-semibold">Passo 1: Perfil</h3>
              <p className="text-sm text-slate-500 mt-1">Complete seu perfil para personalizar sugestões.</p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm">Nome completo</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded border p-2" />
                </div>

                <div>
                  <label className="block text-sm">Público-alvo</label>
                  <select value={audience} onChange={(e) => setAudience(e.target.value)} className="mt-1 w-full rounded border p-2">
                    <option value="mlm">Vendas Diretas (MLM)</option>
                    <option value="politics">Política</option>
                    <option value="marketing">Marketing Geral</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-2">Perfis Profissionais</h4>
                <ProfileSelector value={selectedProfiles} onChange={setSelectedProfiles} />
              </div>

              <div className="mt-6 flex justify-between">
                <button onClick={() => navigate("/dashboard")} className="px-4 py-2 border rounded">Pular</button>
                <div className="space-x-2">
                  <button onClick={() => { setSelectedProfiles(selectedProfiles.length ? selectedProfiles : ["general"]); updateStep(2); }} className="px-4 py-2 bg-gray-100 rounded">Pular</button>
                  <button onClick={handleCompleteProfiles} className="px-4 py-2 bg-indigo-600 text-white rounded">Salvar e Continuar →</button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-xl font-semibold">Passo 2: Conectar Redes Sociais</h3>
              <p className="text-sm text-slate-500 mt-1">Conecte as redes sociais onde você quer publicar seus conteúdos. Você pode pular e conectar depois em Settings.</p>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SOCIAL_PLATFORMS.map((p) => {
                  const s = socialAccounts[p] ?? { connected: false, accountName: null };
                  return (
                    <SocialAccountCard
                      key={p}
                      platform={p as any}
                      isConnected={s.connected}
                      accountName={s.accountName}
                      connecting={!!socialLoading[p]}
                      onConnect={() => connectSocial(p)}
                      onDisconnect={() => disconnectSocial(p)}
                    />
                  );
                })}
              </div>

              <div className="mt-6 flex justify-between">
                <button onClick={() => updateStep(1)} className="px-4 py-2 border rounded">← Voltar</button>
                <div className="space-x-2">
                  <button onClick={() => updateStep(3)} className="px-4 py-2 bg-gray-100 rounded">Pular</button>
                  <button onClick={() => updateStep(3)} className="px-4 py-2 bg-indigo-600 text-white rounded">Continuar →</button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-xl font-semibold">Passo 3: Avatar AI (HeyGen)</h3>
              {userPlan !== "pro" ? (
                <div className="mt-4 p-4 border rounded">
                  <div className="text-lg font-medium">Recursos Pro</div>
                  <div className="text-sm text-slate-500 mt-2">Crie vídeos com avatar digital usando HeyGen. Faça upgrade para o Plano Pro para acessar.</div>
                  <div className="mt-4">
                    <button onClick={() => navigate("/settings?tab=plan")} className="px-4 py-2 bg-indigo-600 text-white rounded">Fazer Upgrade →</button>
                    <button onClick={() => updateStep(4)} className="ml-2 px-4 py-2 border rounded">Pular</button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-slate-500">Conecte sua conta HeyGen para gerar vídeos com avatar.</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm">API Key</label>
                      <input type="password" value={heygenApiKey} onChange={(e) => setHeygenApiKey(e.target.value)} className="mt-1 w-full rounded border p-2" />
                    </div>

                    <div>
                      <label className="block text-sm">Avatar ID</label>
                      <input value={heygenAvatarId} onChange={(e) => setHeygenAvatarId(e.target.value)} className="mt-1 w-full rounded border p-2" />
                    </div>

                    <div>
                      <label className="block text-sm">Voice ID</label>
                      <input value={heygenVoiceId} onChange={(e) => setHeygenVoiceId(e.target.value)} className="mt-1 w-full rounded border p-2" />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button onClick={handleHeygenTest} disabled={heygenTesting} className="px-4 py-2 bg-indigo-600 text-white rounded">
                      {heygenTesting ? "Testando..." : "Testar Conexão"}
                    </button>

                    <button onClick={() => { alert("HeyGen wizard (placeholder)"); }} className="px-4 py-2 border rounded">Como obter essas informações?</button>
                    <button onClick={() => updateStep(4)} className="ml-auto px-4 py-2 border rounded">Pular</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <div className="text-4xl">🎉</div>
              <h3 className="text-2xl font-bold mt-2">Configuração Completa!</h3>
              <p className="text-slate-600 mt-2">Resumo rápido do que foi configurado:</p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 border rounded">
                  <div className="font-medium">Redes conectadas</div>
                  <div className="text-sm text-slate-500 mt-2">{Object.values(socialAccounts || {}).filter((s) => s.connected).length} conectadas</div>
                </div>

                <div className="p-3 border rounded">
                  <div className="font-medium">HeyGen configurado</div>
                  <div className="text-sm text-slate-500 mt-2">{heygenConfigured ? "Sim" : "Não"}</div>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <button onClick={() => finishOnboarding()} className="px-6 py-2 bg-indigo-600 text-white rounded">Ir para Dashboard →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Onboarding;