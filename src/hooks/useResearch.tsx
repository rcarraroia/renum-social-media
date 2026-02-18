import * as React from "react";
import { createResearchVideo, saveGeneratedScript } from "../services/research";
import { useAuthStore } from "../stores/authStore";
import { showLoading, dismissToast, showSuccess, showError } from "../utils/toast";
import { api } from "@/lib/api";
import type { AspectRatio, Platform } from "@/lib/compatibility";

type Status = "idle" | "searching" | "generating" | "ready" | "error";

type Draft = {
  id: string;
  theme: string;
  audience: string;
  script: string;
  created_at: string;
  estimated_seconds?: number;
};

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

  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>([]);

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
    const toastId = showLoading("Gerando script com IA...");
    
    try {
      const response = await api.scriptai.generateScript({
        topic: theme,
        audience,
        tone: "professional",
        duration: 60,
        language: "pt",
      });
      
      dismissToast(toastId);
      setScript(response.script);
      setSources(response.sources ?? []);
      setStatus("ready");
      setStep(2);
      showSuccess("Script gerado com sucesso!");
    } catch (err: any) {
      dismissToast(toastId);
      setStatus("error");
      setError(err?.message ?? "Erro ao gerar script");
      showError(err?.message ?? "Erro ao gerar script");
    }
  }, [theme, audience, orgId, userId, validateThemeInput]);

  const regenerateScript = React.useCallback(async (feedback?: string) => {
    if (!theme) {
      showError("Tema necessário para regenerar");
      return;
    }
    
    setStatus("generating");
    const toastId = showLoading("Regerando script...");
    
    try {
      const response = await api.scriptai.regenerateScript({
        topic: theme,
        script: script,
        feedback: feedback ?? "Gere uma versão alternativa",
        audience,
      });
      
      dismissToast(toastId);
      setScript(response.script);
      setSources(response.sources ?? []);
      setStatus("ready");
      showSuccess("Novo script gerado!");
    } catch (err: any) {
      dismissToast(toastId);
      setStatus("error");
      setError(err?.message ?? "Erro ao regenerar script");
      showError(err?.message ?? "Erro ao regenerar script");
    }
  }, [theme, script, audience]);

  const approveScript = React.useCallback(async () => {
    if (!script || script.trim().length === 0) {
      showError("Script vazio — não é possível aprovar");
      return;
    }
    // Move to config step (step 3) instead of journey (step 4)
    setStep(3);
  }, [script]);

  // Draft helpers - migrados para API backend
  const loadDrafts = React.useCallback(async () => {
    setLoadingDrafts(true);
    try {
      const response = await api.scriptai.listDrafts();
      const mappedDrafts: Draft[] = response.drafts.map((d) => ({
        id: d.id,
        theme: d.topic ?? d.title,
        audience: d.audience ?? "general",
        script: d.script,
        created_at: d.created_at,
        estimated_seconds: Math.round((d.script?.split(/\s+/).length ?? 0) * 0.5),
      }));
      setDrafts(mappedDrafts);
    } catch (e) {
      console.error("Erro ao carregar rascunhos:", e);
      setDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  const saveDraft = React.useCallback(async (payload: { theme: string; audience: string; script: string; estimated_seconds?: number }) => {
    setSavingDraft(true);
    try {
      const response = await api.scriptai.saveDraft({
        title: payload.theme,
        script: payload.script,
        topic: payload.theme,
        audience: payload.audience,
        sources: sources,
        metadata: {
          estimated_seconds: payload.estimated_seconds ?? Math.round((payload.script?.split(/\s+/).length ?? 0) * 0.5),
        },
      });
      
      // Recarregar lista de rascunhos
      await loadDrafts();
      showSuccess("Script salvo como rascunho!");
      return response;
    } catch (e) {
      console.error("Erro ao salvar rascunho:", e);
      showError("Erro ao salvar rascunho");
      return null;
    } finally {
      setSavingDraft(false);
    }
  }, [sources, loadDrafts]);

  const deleteDraft = React.useCallback(async (id: string) => {
    try {
      await api.scriptai.deleteDraft(id);
      // Recarregar lista de rascunhos
      await loadDrafts();
      showSuccess("Rascunho removido");
    } catch (e) {
      console.error("Erro ao deletar rascunho:", e);
      showError("Erro ao deletar rascunho");
    }
  }, [loadDrafts]);

  const loadDraftIntoEditor = React.useCallback(async (id: string) => {
    try {
      const draft = await api.scriptai.getDraft(id);
      setTheme(draft.topic ?? draft.title);
      setAudience(draft.audience ?? "general");
      setScript(draft.script);
      setSources(draft.sources ?? []);
      setStep(3); // move to journey selection directly (as if approved)
    } catch (e) {
      console.error("Erro ao carregar rascunho:", e);
      showError("Erro ao carregar rascunho");
    }
  }, []);

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

    // config
    aspectRatio,
    setAspectRatio,
    selectedPlatforms,
    setSelectedPlatforms,

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