import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { showLoading, dismissToast, showSuccess, showError } from "../utils/toast";
import { saveGeneratedVideo, incrementCreditsUsed } from "@/services/avatar";
import { api } from "@/lib/api";
import type { AspectRatio, Platform } from "@/lib/compatibility";

/**
 * States:
 * - checking
 * - blocked_plan
 * - blocked_heygen
 * - input
 * - approval
 * - generating
 * - ready
 * - failed
 * - no_credits
 */

export type AvatarState =
  | "checking"
  | "blocked_plan"
  | "blocked_heygen"
  | "input"
  | "config"      // ← NOVO: Configuração de vídeo
  | "approval"
  | "generating"
  | "ready"
  | "failed"
  | "no_credits";

export function useAvatar(initialVideoId?: string | null) {
  const navigate = useNavigate();
  const location = useLocation();
  const userResp = supabase.auth.getUser ? null : null; // noop to keep TS happy; we rely on authStore elsewhere
  // local state
  const [state, setState] = React.useState<AvatarState>("checking");
  const [script, setScript] = React.useState<string>("");
  const [theme, setTheme] = React.useState<string>("");
  const [audience, setAudience] = React.useState<string>("");
  const [estimatedSeconds, setEstimatedSeconds] = React.useState<number>(0);

  const [credits, setCredits] = React.useState<{ used: number; total: number }>({ used: 0, total: 0 });
  const [heygenConfig, setHeygenConfig] = React.useState<{ apiKey?: string | null; avatarId?: string | null; voiceId?: string | null }>({
    apiKey: null,
    avatarId: null,
    voiceId: null,
  });
  const [plan, setPlan] = React.useState<"free" | "starter" | "pro">("free");

  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [progressStep, setProgressStep] = React.useState<number>(0); // 0-4
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  // Configuração de vídeo (proporção e plataformas) - NOVO
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>([]);

  // Helper to calculate words/duration
  const countWords = (t: string) => (t ? t.trim().split(/\s+/).length : 0);
  const estimateSecondsFromText = (t: string) => Math.round(countWords(t) * 0.5);

  // On mount: check org config and read router state
  React.useEffect(() => {
    let mounted = true;
    async function init() {
      setState("checking");
      setLoading(true);
      try {
        // If there's router state with script from ScriptAI, use it
        const sstate: any = (location && (location.state as any)) || null;
        if (sstate?.script) {
          setScript(sstate.script);
          setTheme(sstate.theme ?? "");
          setAudience(sstate.audience ?? "");
          setEstimatedSeconds(sstate.estimated_seconds ?? estimateSecondsFromText(sstate.script));
        }

        // Fetch organization data
        // We attempt to find the organization via users table using auth (supabase client)
        // The current auth user can be retrieved via supabase.auth.getUser()
        const { data: userData } = await supabase.auth.getUser();
        const authUser = userData?.user;
        if (!authUser) {
          // no auth user — treat as blocked
          if (mounted) {
            setState("blocked_heygen");
            setLoading(false);
          }
          return;
        }

        // Query users row and organization data (single query)
        const res: any = await (supabase as any)
          .from("users")
          .select("organization_id")
          .eq("id", authUser.id)
          .single();

        const orgId = res?.data?.organization_id ?? null;
        if (!orgId) {
          if (mounted) {
            setState("blocked_heygen");
            setLoading(false);
          }
          return;
        }

        const orgRes: any = await supabase
          .from("organizations")
          .select("plan,heygen_api_key,heygen_avatar_id,heygen_voice_id,heygen_credits_used,heygen_credits_total")
          .eq("id", orgId)
          .single();

        const org = orgRes?.data ?? null;
        if (!org) {
          if (mounted) {
            setState("blocked_heygen");
            setLoading(false);
          }
          return;
        }

        const orgPlan = org.plan ?? "free";
        if (mounted) setPlan(orgPlan);

        const cfg = {
          apiKey: org.heygen_api_key ?? null,
          avatarId: org.heygen_avatar_id ?? null,
          voiceId: org.heygen_voice_id ?? null,
        };
        if (mounted) setHeygenConfig(cfg);

        const used = org.heygen_credits_used ?? 0;
        const total = org.heygen_credits_total ?? 0;
        if (mounted) setCredits({ used, total });

        // Evaluate prereqs
        if (orgPlan !== "pro") {
          if (mounted) setState("blocked_plan");
        } else if (!cfg.apiKey || !cfg.avatarId || !cfg.voiceId) {
          if (mounted) setState("blocked_heygen");
        } else {
          // ready to proceed; if a script was imported, jump to config; else input
          if (sstate?.script) {
            // Se vier com config do Module1, pular para approval
            if (sstate?.aspectRatio && sstate?.platforms) {
              if (mounted) {
                setAspectRatio(sstate.aspectRatio);
                setSelectedPlatforms(sstate.platforms);
                setState("approval");
              }
            } else {
              // Sem config, ir para config step
              if (mounted) setState("config");
            }
          } else {
            if (mounted) setState("input");
          }
        }
      } catch (err: any) {
        // fallback
        if (mounted) {
          setState("blocked_heygen");
          setError("Erro ao carregar configuração da organização");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate video: chama backend via API client
  const generateVideo = React.useCallback(async () => {
    // pre-check credits
    const remaining = Math.max(0, (credits.total ?? 0) - (credits.used ?? 0));
    if ((credits.total ?? 0) > 0 && remaining <= 0) {
      setState("no_credits");
      setError("Sem créditos HeyGen");
      return { error: "no_credits" };
    }

    // Validar se tem aspectRatio configurado
    if (!aspectRatio) {
      showError("Configure a proporção do vídeo antes de gerar");
      return { error: "missing_config" };
    }

    setState("generating");
    setError(null);
    setProgressStep(1);
    
    try {
      const toastId = showLoading("Iniciando geração com HeyGen...");
      
      // Mapear aspect_ratio e dimension para HeyGen
      const aspectRatioMap = {
        '9:16': { 
          aspect_ratio: '9:16', 
          dimension: { width: 1080, height: 1920 } 
        },
        '1:1': { 
          aspect_ratio: '1:1', 
          dimension: { width: 1080, height: 1080 } 
        },
        '16:9': { 
          aspect_ratio: '16:9', 
          dimension: { width: 1920, height: 1080 } 
        }
      };

      const videoConfig = aspectRatioMap[aspectRatio];
      
      // 1. Chamar API para gerar vídeo COM aspect_ratio
      // TODO: Adicionar aspect_ratio e dimension quando backend suportar
      const response = await api.avatarai.generateVideo({
        script,
        avatarId: heygenConfig?.avatarId ?? "",
        voiceId: heygenConfig?.voiceId ?? "",
        title: theme || "Vídeo gerado com AvatarAI",
        // aspectRatio: videoConfig.aspect_ratio,
        // dimension: videoConfig.dimension,
      });
      
      setJobId(response.jobId);
      dismissToast(toastId);
      
      // 2. Polling para verificar status
      const pollToast = showLoading("Gerando vídeo...");
      let attempts = 0;
      const maxAttempts = 60; // 5 minutos (5s * 60)
      
      const pollInterval = setInterval(async () => {
        attempts++;
        
        try {
          const statusResponse = await api.avatarai.getVideoStatus(response.jobId);
          
          // Atualizar progresso baseado no status
          if (statusResponse.status === "processing") {
            const progress = statusResponse.progress ?? 0;
            if (progress < 25) setProgressStep(1);
            else if (progress < 50) setProgressStep(2);
            else if (progress < 75) setProgressStep(3);
            else setProgressStep(4);
          }
          
          // Verificar se completou
          if (statusResponse.status === "completed") {
            clearInterval(pollInterval);
            dismissToast(pollToast);
            
            setVideoUrl(statusResponse.video_url ?? null);
            setState("ready");
            setProgressStep(4);
            
            // Atualizar créditos localmente
            setCredits((c) => ({ ...c, used: Math.min((c.used ?? 0) + 1, c.total ?? c.used + 1) }));
            
            showSuccess("Vídeo gerado com sucesso!");
            return { data: { videoUrl: statusResponse.video_url } };
          }
          
          // Verificar se falhou
          if (statusResponse.status === "failed") {
            clearInterval(pollInterval);
            dismissToast(pollToast);
            
            setState("failed");
            setError(statusResponse.error ?? "Erro na geração do vídeo");
            showError(statusResponse.error ?? "Erro na geração do vídeo");
            return { error: statusResponse.error };
          }
          
          // Timeout
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            dismissToast(pollToast);
            
            setState("failed");
            setError("Timeout: geração demorou muito tempo");
            showError("Timeout: geração demorou muito tempo");
            return { error: "timeout" };
          }
        } catch (pollErr: any) {
          console.error("Erro ao verificar status:", pollErr);
          // Continuar tentando...
        }
      }, 5000); // Poll a cada 5 segundos
      
    } catch (err: any) {
      console.error("Erro ao gerar vídeo:", err);
      setState("failed");
      setError(err?.message ?? "Erro na geração");
      showError(err?.message ?? "Erro na geração");
      return { error: err };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script, theme, credits, heygenConfig, aspectRatio]);

  const cancelGeneration = React.useCallback(async () => {
    // For mock: just reset
    if (confirm("O vídeo em geração será perdido. Deseja cancelar?")) {
      setState("input");
      setJobId(null);
      setProgressStep(0);
      setVideoUrl(null);
      setError(null);
    }
  }, []);

  // Expose a helper to import script (used when navigating with Router state)
  const loadScriptFromState = React.useCallback((s: { 
    script?: string; 
    theme?: string; 
    audience?: string; 
    estimated_seconds?: number;
    aspectRatio?: AspectRatio;
    selectedPlatforms?: Platform[];
  } | null) => {
    if (!s) return;
    if (s.script) {
      setScript(s.script);
      setTheme(s.theme ?? "");
      setAudience(s.audience ?? "");
      setEstimatedSeconds(s.estimated_seconds ?? estimateSecondsFromText(s.script));
      
      // Load config from Module1 if available
      if (s.aspectRatio) {
        setAspectRatio(s.aspectRatio);
      }
      if (s.selectedPlatforms && s.selectedPlatforms.length > 0) {
        setSelectedPlatforms(s.selectedPlatforms);
      }
      
      // If config is provided, skip config step and go to approval
      if (s.aspectRatio && s.selectedPlatforms && s.selectedPlatforms.length > 0) {
        setState("approval");
      } else {
        setState("config");
      }
    }
  }, []);

  // Helper to reset and create new
  const reset = React.useCallback(() => {
    setScript("");
    setTheme("");
    setAudience("");
    setEstimatedSeconds(0);
    setVideoUrl(null);
    setJobId(null);
    setProgressStep(0);
    setError(null);
    setAspectRatio(null);
    setSelectedPlatforms([]);
    setState("input");
  }, []);

  return {
    state,
    checking: state === "checking",
    blocked_plan: state === "blocked_plan",
    blocked_heygen: state === "blocked_heygen",
    input: state === "input",
    config: state === "config",        // ← NOVO
    approval: state === "approval",
    generating: state === "generating",
    ready: state === "ready",
    failed: state === "failed",
    no_credits: state === "no_credits",

    script,
    setScript,
    theme,
    setTheme,
    audience,
    setAudience,
    estimatedSeconds,
    setEstimatedSeconds,

    credits,
    heygenConfig,
    plan,

    videoUrl,
    progressStep,
    error,
    loading,

    // Configuração de vídeo - NOVO
    aspectRatio,
    setAspectRatio,
    selectedPlatforms,
    setSelectedPlatforms,

    loadScriptFromState,
    generateVideo,
    cancelGeneration,
    reset,
  };
}