import React, { useEffect, useState } from "react";

type Credentials = {
  apiKey?: string | null;
  avatarId?: string | null;
  voiceId?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (creds?: Credentials) => void;
  initialStep?: number;
  existingCredentials?: Credentials;
};

const EXTERNAL = {
  HEYGEN: "https://www.heygen.com",
  HEYGEN_SETTINGS: "https://app.heygen.com/settings",
  HEYGEN_AVATARS: "https://app.heygen.com/avatars",
  HEYGEN_VOICES: "https://app.heygen.com/voices",
};

const StepLabel: React.FC<{ index: number; active: boolean; label?: string }> = ({ index, active, label }) => (
  <div className={`flex items-center gap-2 ${active ? "text-indigo-600" : "text-slate-500"}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? "bg-indigo-100 text-indigo-700" : "bg-slate-100"}`}>{index}</div>
    <div className="text-xs hidden md:block">{label}</div>
  </div>
);

const fetchSavedCredentials = async (): Promise<Credentials | null> => {
  try {
    const res = await fetch("/api/integrations/heygen");
    if (!res.ok) {
      // try status endpoint
      const res2 = await fetch("/api/integrations/heygen/status");
      if (!res2.ok) return null;
      const j2 = await res2.json();
      return {
        apiKey: j2?.apiKey ?? null,
        avatarId: j2?.avatarId ?? null,
        voiceId: j2?.voiceId ?? null,
      };
    }
    const j = await res.json();
    return {
      apiKey: j?.apiKey ?? null,
      avatarId: j?.avatarId ?? null,
      voiceId: j?.voiceId ?? null,
    };
  } catch {
    return null;
  }
};

const HeyGenSetupWizard: React.FC<Props> = ({ isOpen, onClose, onComplete, initialStep = 1, existingCredentials }) => {
  const [step, setStep] = useState<number>(initialStep);
  const [checkedAccount, setCheckedAccount] = useState(false);
  const [checkedTwin, setCheckedTwin] = useState(false);

  const [apiKey, setApiKey] = useState<string>("");
  const [showApi, setShowApi] = useState(false);
  const [avatarId, setAvatarId] = useState<string>("");
  const [voiceId, setVoiceId] = useState<string>("");

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep(initialStep);
    // populate with existing credentials if given
    if (existingCredentials) {
      setApiKey(existingCredentials.apiKey ?? "");
      setAvatarId(existingCredentials.avatarId ?? "");
      setVoiceId(existingCredentials.voiceId ?? "");
      setCheckedAccount(Boolean(existingCredentials.apiKey));
      setCheckedTwin(Boolean(existingCredentials.avatarId));
    } else {
      // attempt to fetch saved credentials to resume
      (async () => {
        setLoadingSaved(true);
        const saved = await fetchSavedCredentials();
        setLoadingSaved(false);
        if (saved) {
          if (saved.apiKey) setApiKey(saved.apiKey);
          if (saved.avatarId) setAvatarId(saved.avatarId);
          if (saved.voiceId) setVoiceId(saved.voiceId);
          setCheckedAccount(Boolean(saved.apiKey));
          setCheckedTwin(Boolean(saved.avatarId));
          // choose appropriate step
          if (saved.apiKey && saved.avatarId && saved.voiceId) {
            setStep(7);
          } else if (saved.apiKey && saved.avatarId) {
            setStep(6);
          } else if (saved.apiKey) {
            setStep(5);
          } else {
            setStep(1);
          }
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const closeWithConfirm = () => {
    const partial = Boolean(apiKey || avatarId || voiceId);
    if (partial) {
      if (!confirm("Você ainda não concluiu a configuração. Deseja sair? Seu progresso será salvo.")) return;
    }
    onClose();
  };

  const next = () => {
    if (step === 2 && !checkedAccount) return alert("Por favor confirme que criou sua conta no HeyGen para continuar.");
    if (step === 3 && !checkedTwin) return alert("Por favor confirme que criou seu Digital Twin para continuar.");
    if (step === 4 && (!apiKey || apiKey.trim().length < 10)) return alert("API Key inválida ou ausente.");
    if (step === 5 && (!avatarId || avatarId.trim().length === 0)) return alert("Avatar ID é obrigatório.");
    if (step === 6 && (!voiceId || voiceId.trim().length === 0)) return alert("Voice ID é obrigatório.");
    setStep((s) => Math.min(7, s + 1));
  };

  const back = () => {
    if (step <= 1) closeWithConfirm();
    else setStep((s) => s - 1);
  };

  const openExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/integrations/heygen/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, avatarId, voiceId }),
      });
      const j = await res.json();
      if (res.ok && j?.success) {
        setTestResult({ ok: true, message: j?.message ?? "Conexão válida" });
        // Save credentials automatically
        await saveCredentials(true);
      } else {
        setTestResult({ ok: false, message: j?.message ?? "Falha ao testar conexão" });
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: e?.message ?? "Erro ao testar conexão" });
    } finally {
      setTesting(false);
    }
  };

  const saveCredentials = async (skipTestAfter = false) => {
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/heygen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          avatarId,
          voiceId,
        }),
      });
      if (res.ok) {
        if (!skipTestAfter) {
          // optionally test
        }
        setSaving(false);
        return true;
      } else {
        const text = await res.text();
        setSaving(false);
        alert(text || "Erro ao salvar");
        return false;
      }
    } catch (e) {
      setSaving(false);
      alert("Erro ao salvar credenciais");
      return false;
    }
  };

  const handleFinish = async () => {
    // require test success before concluding
    if (!testResult?.ok) {
      if (!confirm("Você não testou a conexão com sucesso. Deseja tentar testar agora?")) {
        return;
      }
      await handleTestConnection();
      if (!testResult?.ok) return;
    }
    // save again to ensure backend persistence
    const ok = await saveCredentials(true);
    if (ok) {
      onComplete?.({ apiKey, avatarId, voiceId });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={closeWithConfirm} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto bg-white rounded-lg p-4 md:p-6">
        {/* Header / Stepper */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-xl font-semibold">HeyGen Setup</div>
            <div className="text-sm text-slate-500 hidden md:block">Passo {step} de 7</div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2">
              <StepLabel index={1} active={step === 1} label="Intro" />
              <StepLabel index={2} active={step === 2} label="Conta" />
              <StepLabel index={3} active={step === 3} label="Digital Twin" />
              <StepLabel index={4} active={step === 4} label="API Key" />
              <StepLabel index={5} active={step === 5} label="Avatar ID" />
              <StepLabel index={6} active={step === 6} label="Voice ID" />
              <StepLabel index={7} active={step === 7} label="Testar" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {step === 1 && (
            <div>
              <div className="text-6xl">🤖</div>
              <h2 className="text-2xl font-bold mt-3">Configure seu Avatar AI</h2>
              <p className="text-sm text-slate-600 mt-2">Para criar vídeos com seu avatar digital, você precisa de uma conta no HeyGen. Vamos te guiar passo a passo.</p>

              <ul className="mt-4 list-none space-y-2 text-sm">
                <li>☐ Criar conta no HeyGen</li>
                <li>☐ Criar seu Digital Twin (clone digital)</li>
                <li>☐ Copiar suas credenciais</li>
                <li>☐ Testar conexão no RENUM</li>
              </ul>

              <div className="mt-4 text-sm text-slate-500">Tempo estimado: Aproximadamente 10-15 minutos</div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold">Crie sua conta no HeyGen</h2>
              <ol className="list-decimal ml-6 mt-3 space-y-2 text-sm">
                <li>Clique no botão abaixo para abrir o site do HeyGen</li>
                <li>Crie uma conta gratuita (email ou Google)</li>
                <li>Confirme seu email se necessário</li>
                <li>Quando terminar, volte aqui e clique em Próximo</li>
              </ol>

              <div className="mt-4 flex gap-2">
                <button onClick={() => openExternal(EXTERNAL.HEYGEN)} className="px-4 py-2 rounded bg-indigo-600 text-white">Abrir HeyGen →</button>
                <button onClick={() => setCheckedAccount(true)} className={`px-4 py-2 rounded ${checkedAccount ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>Marcar como concluído</button>
              </div>

              <div className="mt-4 text-sm">
                <div className="font-medium">Planos (resumo)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-xs">
                  <div className="p-2 border rounded">
                    <div className="font-medium">Free</div>
                    <div>3 vídeos/mês, 720p, watermark</div>
                  </div>
                  <div className="p-2 border rounded">
                    <div className="font-medium">Creator ($29/mês)</div>
                    <div>vídeos ilimitados, 1080p</div>
                  </div>
                  <div className="p-2 border rounded">
                    <div className="font-medium">API Pro ($99/mês)</div>
                    <div>100 créditos, 1080p, sem watermark</div>
                  </div>
                </div>
                <div className="mt-2 text-slate-500 text-xs">Dica: para uso via API recomendamos Creator ou API Pro.</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold">Crie seu Digital Twin (Clone Digital)</h2>
              <ol className="list-decimal ml-6 mt-3 space-y-2 text-sm">
                <li>No painel do HeyGen, vá em 'Avatars' → 'Create Avatar'</li>
                <li>Escolha 'Instant Avatar' ou 'Studio Avatar'</li>
                <li>Siga as instruções do HeyGen para gravar o vídeo de calibração</li>
                <li>Aguarde o processamento (pode levar até 24h para Studio)</li>
                <li>Quando pronto, volte aqui</li>
              </ol>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="p-3 border rounded">
                  <div className="font-medium">Dica</div>
                  <ul className="mt-2 text-xs">
                    <li>Use boa iluminação</li>
                    <li>Fundo neutro</li>
                    <li>Olhe para a câmera</li>
                    <li>Fale naturalmente</li>
                  </ul>
                </div>

                <div className="p-3 border rounded">
                  <div className="font-medium">Sugestão</div>
                  <div className="text-xs mt-2">Se você quer qualidade máxima, use Studio Avatar e boa conexão à internet.</div>
                </div>
              </div>

              <div className="mt-4">
                <button onClick={() => openExternal(EXTERNAL.HEYGEN_AVATARS)} className="px-4 py-2 rounded bg-indigo-600 text-white">Abrir Meus Avatares →</button>
                <button onClick={() => setCheckedTwin(true)} className={`ml-2 px-4 py-2 rounded ${checkedTwin ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>Marcar como concluído</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold">Copie sua API Key</h2>
              <ol className="list-decimal ml-6 mt-3 space-y-2 text-sm">
                <li>No painel do HeyGen, abra Settings → API</li>
                <li>Clique em 'Generate API Key' ou copie a existente</li>
                <li>Cole a API Key no campo abaixo</li>
              </ol>

              <div className="mt-4">
                <label className="text-sm block">API Key</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type={showApi ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Cole sua API Key aqui"
                    className="flex-1 rounded border p-2"
                  />
                  <button onClick={() => setShowApi((s) => !s)} className="px-3 py-2 rounded bg-gray-100">{showApi ? "Ocultar" : "Mostrar"}</button>
                </div>

                <div className="mt-3 flex gap-2">
                  <button onClick={() => openExternal(EXTERNAL.HEYGEN_SETTINGS)} className="px-4 py-2 rounded bg-indigo-600 text-white">Abrir Settings do HeyGen →</button>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-xl font-semibold">Copie seu Avatar ID</h2>
              <ol className="list-decimal ml-6 mt-3 space-y-2 text-sm">
                <li>No painel do HeyGen, vá em 'Avatars' → 'My Avatars'</li>
                <li>Clique no seu Digital Twin</li>
                <li>O Avatar ID aparece na URL ou nos detalhes do avatar</li>
                <li>Copie e cole aqui</li>
              </ol>

              <div className="mt-4">
                <label className="text-sm block">Avatar ID</label>
                <input value={avatarId} onChange={(e) => setAvatarId(e.target.value)} className="mt-2 w-full rounded border p-2" placeholder="Ex: xxxx_xxxx_xxxx" />
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openExternal(EXTERNAL.HEYGEN_AVATARS)} className="px-4 py-2 rounded bg-indigo-600 text-white">Abrir Meus Avatares →</button>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 className="text-xl font-semibold">Copie seu Voice ID</h2>
              <ol className="list-decimal ml-6 mt-3 space-y-2 text-sm">
                <li>No painel do HeyGen, vá em 'Voices' → 'My Voices'</li>
                <li>Copie o Voice ID da voz desejada</li>
                <li>Ou crie um Voice Clone se precisar</li>
              </ol>

              <div className="mt-4">
                <label className="text-sm block">Voice ID</label>
                <input value={voiceId} onChange={(e) => setVoiceId(e.target.value)} className="mt-2 w-full rounded border p-2" />
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openExternal(EXTERNAL.HEYGEN_VOICES)} className="px-4 py-2 rounded bg-indigo-600 text-white">Abrir Minhas Vozes →</button>
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <h2 className="text-xl font-semibold">Testar e Salvar</h2>
              <p className="text-sm text-slate-600 mt-2">Resumo das credenciais fornecidas:</p>

              <div className="mt-4 space-y-2 text-sm">
                <div>API Key: {apiKey ? "••••••••••" : <span className="text-red-600">Não informado</span>}</div>
                <div>Avatar ID: {avatarId ?? <span className="text-red-600">Não informado</span>}</div>
                <div>Voice ID: {voiceId ?? <span className="text-red-600">Não informado</span>}</div>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={handleTestConnection} disabled={testing} className="px-4 py-2 rounded bg-indigo-600 text-white">{testing ? "Verificando..." : "Testar Conexão"}</button>
                <button onClick={() => saveCredentials(true)} className="px-4 py-2 rounded bg-gray-100">Salvar (sem testar)</button>
              </div>

              <div className="mt-4">
                {testResult?.ok && <div className="text-green-700">✅ {testResult.message}</div>}
                {testResult && !testResult.ok && <div className="text-red-600">❌ {testResult.message}</div>}
              </div>

              <div className="mt-4 text-xs text-slate-500">
                Observação: se o teste for bem-sucedido as credenciais serão salvas automaticamente na sua organização.
              </div>
            </div>
          )}
        </div>

        {/* Footer: Prev / Next / Close */}
        <div className="mt-4 sticky bottom-0 left-0 right-0 bg-white p-3 border-t flex items-center justify-between">
          <div>
            <button onClick={back} className="px-4 py-2 rounded bg-gray-100">Voltar</button>
          </div>

          <div className="flex gap-2">
            {step < 7 ? (
              <button onClick={next} className="px-6 py-2 rounded bg-indigo-600 text-white">Próximo →</button>
            ) : (
              <button onClick={handleFinish} className="px-6 py-2 rounded bg-green-600 text-white" disabled={testing || saving}>Concluir</button>
            )}

            <button onClick={closeWithConfirm} className="px-4 py-2 rounded bg-white border">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeyGenSetupWizard;