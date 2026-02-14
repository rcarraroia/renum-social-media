import * as React from "react";
import { createResearchVideo, saveGeneratedScript } from "../services/research";
import { useAuthStore } from "../stores/authStore";
import { showLoading, dismissToast, showSuccess, showError } from "../utils/toast";

type Status = "idle" | "searching" | "generating" | "ready" | "error";

type Draft = {
  id: string;
  theme: string;
  audience: string;
  script: string;
  created_at: string;
  estimated_seconds?: number;
};

const MOCK_SCRIPT = `
[ABERTURA - 0:00-0:10]
Você sabia que 80% das brasileiras têm deficiência de vitamina D? 🌞 Isso afeta diretamente a saúde da sua pele!

[DESENVOLVIMENTO - 0:10-1:00]
A vitamina D é essencial para:

✨ Renovação celular - Estimula a produção de colágeno e elastina, mantendo a pele firme

💪 Proteção natural - Fortalece a barreira cutânea contra agressores externos

🧠 Anti-inflamatória - Reduz vermelhidão, acne e dermatites

[FECHAMENTO - 1:00-1:20]
Quer saber se você tem deficiência de vitamina D? Comente aqui embaixo! E se você é consultora, aproveite para compartilhar produtos com vitamina D que podem ajudar suas clientes! 💖
`.trim();

const MOCK_SOURCES = [
  {
    title: "Sociedade Brasileira de Dermatologia - Vitamina D e Pele",
    url: "https://sbd.org.br/vitamina-d-pele",
    snippet: "Estudo mostra que 80% das brasileiras apresentam níveis insuficientes..."
  },
  {
    title: "PubMed: Vitamin D and Skin Health",
    url: "https://pubmed.ncbi.nlm.nih.gov/12345",
    snippet: "Níveis adequados podem reduzir sinais de envelhecimento..."
  },
];

function draftStorageKey(userId?: string) {
  return `renum_script_drafts_${userId ?? "anon"}`;
}

export function useResearch() {
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organization_id ?? "";
  const userId = user?.id ?? "";

  const [step, setStep] = React.useState<number>(1);
  const [videoId, setVideoId] = React.useState<string | null>(null);
  const [theme, setTheme] = React.useState<string>("");
  const [audience, setAudience] = React.useState<string>("mlm");
  const [script, setScript] = React.useState<string>("");
  const [sources, setSources] = React.useState<any[]>([]);
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = React.useState<boolean>(false);
  const [savingDraft, setSavingDraft] = React.useState<boolean>(false);

  React.useEffect(() => {
    loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const validateThemeInput = React.useCallback((t: string, a: string) => {
    const errors: string[] = [];
    if (!t.trim()) errors.push("Digite um tema para o vídeo");
    if (t.trim().length < 10) errors.push("Tema muito curto. Seja mais específico (mín: 10 caracteres)");
    if (!a) errors.push("Selecione um público-alvo");
    return errors;
  }, []);

  const createScript = React.useCallback(async () => {
    const errs = validateThemeInput(theme, audience);
    if (errs.length) {
      errs.forEach((e) => showError(e));
      return;
    }

    if (!orgId || !userId) {
      showError("Usuário ou organização não encontrados");
      return;
    }

    setStatus("searching");
    try {
      const toastId = showLoading("Criando rascunho e pesquisando...");
      // Call real backend in future
      // const { data, error: cErr } = await createResearchVideo(orgId, userId, theme, audience);
      dismissToast(toastId);

      // Mock generation
      setTimeout(() => {
        setScript(MOCK_SCRIPT);
        setSources(MOCK_SOURCES);
        setStatus("ready");
        setStep(2);
        showSuccess("Script gerado com sucesso (mock)");
      }, 1000);
    } catch (err: any) {
      setStatus("error");
      setError(err?.message ?? "Erro ao iniciar pesquisa");
      showError(err?.message ?? "Erro ao iniciar pesquisa");
      return;
    }
  }, [theme, audience, orgId, userId, validateThemeInput]);

  const regenerateScript = React.useCallback(async (feedback?: string) => {
    if (!videoId && !theme) {
      showError("Tema ou rascunho necessário para regenerar");
      return;
    }
    setStatus("generating");
    const toastId = showLoading("Regerando script...");
    // MOCK
    setTimeout(() => {
      dismissToast(toastId);
      setScript((s) => (s ? s + "\n\n(versão regenerada)" : MOCK_SCRIPT));
      setStatus("ready");
      showSuccess("✅ Novo script gerado (mock)");
    }, 1500);
  }, [videoId, theme]);

  const approveScript = React.useCallback(async () => {
    if (!script || script.trim().length === 0) {
      showError("Script vazio — não é possível aprovar");
      return;
    }
    // Move to journey selection step
    setStep(3);
  }, [script]);

  // Draft helpers (localStorage-backed mock)
  const loadDrafts = React.useCallback(() => {
    setLoadingDrafts(true);
    try {
      const raw = localStorage.getItem(draftStorageKey(userId));
      const arr: Draft[] = raw ? JSON.parse(raw) : [];
      setDrafts(arr);
    } catch (e) {
      setDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  }, [userId]);

  const saveDraft = React.useCallback(async (payload: { theme: string; audience: string; script: string; estimated_seconds?: number }) => {
    setSavingDraft(true);
    try {
      const id = `draft_${Date.now()}`;
      const d: Draft = {
        id,
        theme: payload.theme,
        audience: payload.audience,
        script: payload.script,
        created_at: new Date().toISOString(),
        estimated_seconds: payload.estimated_seconds ?? Math.round((payload.script?.split(/\s+/).length ?? 0) * 0.5),
      };
      const raw = localStorage.getItem(draftStorageKey(userId));
      const arr: Draft[] = raw ? JSON.parse(raw) : [];
      arr.unshift(d);
      localStorage.setItem(draftStorageKey(userId), JSON.stringify(arr));
      setDrafts(arr);
      showSuccess("Script salvo como rascunho!");
      return d;
    } catch (e) {
      showError("Erro ao salvar rascunho");
      return null;
    } finally {
      setSavingDraft(false);
    }
  }, [userId]);

  const deleteDraft = React.useCallback((id: string) => {
    const raw = localStorage.getItem(draftStorageKey(userId));
    const arr: Draft[] = raw ? JSON.parse(raw) : [];
    const next = arr.filter((d) => d.id !== id);
    localStorage.setItem(draftStorageKey(userId), JSON.stringify(next));
    setDrafts(next);
    showSuccess("Rascunho removido");
  }, [userId]);

  const loadDraftIntoEditor = React.useCallback((id: string) => {
    const raw = localStorage.getItem(draftStorageKey(userId));
    const arr: Draft[] = raw ? JSON.parse(raw) : [];
    const d = arr.find((x) => x.id === id);
    if (!d) {
      showError("Rascunho não encontrado");
      return;
    }
    setTheme(d.theme);
    setAudience(d.audience);
    setScript(d.script);
    setStep(3); // move to journey selection directly (as if approved)
  }, [userId]);

  const generateScript = createScript;
  const loading = status === "searching" || status === "generating";
  const saving_draft = savingDraft;

  return {
    // state
    step,
    setStep,
    theme,
    setTheme,
    audience,
    setAudience,
    script,
    setScript,
    sources,
    status,
    error,

    // actions
    createScript,
    generateScript,
    regenerateScript,
    approveScript,

    // drafts
    drafts,
    loadingDrafts,
    saveDraft,
    deleteDraft,
    loadDraftIntoEditor,
    saving_draft,

    // helpers
    loading,
  };
}