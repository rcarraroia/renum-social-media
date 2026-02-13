import * as React from "react";
import { createResearchVideo, saveGeneratedScript } from "@/services/research";
import { useAuthStore } from "../stores/authStore";
import { showLoading, dismissToast, showSuccess, showError } from "../utils/toast";

type Status = "idle" | "searching" | "generating" | "ready" | "error";

const MOCK_SCRIPT = `
[ABERTURA - 0:00-0:10]
Você sabia que 80% das brasileiras têm deficiência de vitamina D? 🌞 Isso afeta diretamente a saúde da sua pele!

[DESENVOLVIMENTO - 0:10-1:00]
A vitamina D é essencial para:

✨ Renovação celular - Estimula a produção de colágeno e elastina, mantendo a pele firme

💪 Proteção natural - Fortalece a barreira cutânea contra agressores externos

🧠 Anti-inflamatória - Reduz vermelhidão, acne e dermatites

Segundo estudo da Sociedade Brasileira de Dermatologia, níveis adequados de vitamina D podem reduzir em até 40% os sinais de envelhecimento.

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
      const { data, error: cErr } = await createResearchVideo(orgId, userId, theme, audience);
      dismissToast(toastId);
      if (cErr || !data) {
        throw cErr ?? new Error("Falha ao criar o rascunho");
      }
      setVideoId(data.id);
    } catch (err: any) {
      setStatus("error");
      setError(err?.message ?? "Erro ao iniciar pesquisa");
      showError(err?.message ?? "Erro ao iniciar pesquisa");
      return;
    }

    // MOCK: simulate search -> generate
    setTimeout(() => {
      setStatus("generating");
    }, 1200);

    setTimeout(() => {
      setScript(MOCK_SCRIPT);
      setSources(MOCK_SOURCES);
      setStatus("ready");
      setStep(2);
      showSuccess("Script gerado com sucesso (mock)");
    }, 3500);
  }, [theme, audience, orgId, userId, validateThemeInput]);

  const regenerateScript = React.useCallback(async (feedback?: string) => {
    if (!videoId) {
      showError("Vídeo não encontrado para regenerar");
      return;
    }
    setStatus("generating");
    const toastId = showLoading("Regerando script...");
    // MOCK
    setTimeout(() => {
      dismissToast(toastId);
      setScript((s) => s + "\n\n(versão regenerada)"); // small variation
      setStatus("ready");
      showSuccess("✅ Novo script gerado (mock)");
    }, 2000);
  }, [videoId]);

  const approveScript = React.useCallback(async () => {
    if (!videoId) {
      showError("Vídeo não encontrado para salvar");
      return;
    }
    setStatus("generating");
    try {
      const toastId = showLoading("Salvando script...");
      const { data, error: saveErr } = await saveGeneratedScript(videoId, script, sources);
      dismissToast(toastId);
      if (saveErr) {
        throw saveErr;
      }
      setStatus("ready");
      setStep(3);
      showSuccess("✅ Script salvo e rascunho criado");
    } catch (err: any) {
      setStatus("error");
      showError(err?.message ?? "Erro ao salvar script");
    }
  }, [videoId, script, sources]);

  return {
    step,
    setStep,
    videoId,
    theme,
    setTheme,
    audience,
    setAudience,
    script,
    setScript,
    sources,
    status,
    error,
    createScript,
    regenerateScript,
    approveScript,
  };
}