import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { showLoading, dismissToast, showSuccess, showError } from "../utils/toast";
import { saveGeneratedVideo, incrementCreditsUsed } from "@/services/avatar";

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
          // ready to proceed; if a script was imported, jump to approval; else input
          if (sstate?.script) {
            if (mounted) setState("approval");
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

  // Generate video: will mock the flow but call backend placeholders if desired
  const generateVideo = React.useCallback(async () => {
    // pre-check credits
    const remaining = Math.max(0, (credits.total ?? 0) - (credits.used ?? 0));
    if ((credits.total ?? 0) > 0 && remaining <= 0) {
      setState("no_credits");
      setError("Sem créditos HeyGen");
      return { error: "no_credits" };
    }

    setState("generating");
    setError(null);
    setProgressStep(1);
    try {
      const toastId = showLoading("Iniciando geração com HeyGen...");
      // In a real integration we would call POST /api/modules/3/generate-video and obtain jobId
      // We'll simulate a job id and poll steps
      const fakeJobId = `job_${Date.now()}`;
      setJobId(fakeJobId);

      // Simulated step progression
      // Step 1: sending script
      await new Promise((r) => setTimeout(r, 900));
      setProgressStep(1);

      // Step 2: generating audio
      await new Promise((r) => setTimeout(r, 1200));
      setProgressStep(2);

      // Step 3: rendering
      await new Promise((r) => setTimeout(r, 1400));
      setProgressStep(3);

      // Step 4: finalizing
      await new Promise((r) => setTimeout(r, 800));
      setProgressStep(4);

      // Mock video URL (use a sample mp4)
      const MOCK_VIDEO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
      setVideoUrl(MOCK_VIDEO_URL);

      // Decrement credits (best-effort)
      try {
        await incrementCreditsUsed(heygenConfig?.apiKey ? "" : ""); // best-effort call; actual implementation should send org id
        // locally update credits mock
        setCredits((c) => ({ ...c, used: Math.min((c.used ?? 0) + 1, c.total ?? c.used + 1) }));
      } catch {
        // ignore
      }

      dismissToast(toastId);
      setState("ready");
      showSuccess("Vídeo gerado com sucesso (mock)");
      return { data: { videoUrl: MOCK_VIDEO_URL } };
    } catch (err: any) {
      setState("failed");
      setError(err?.message ?? "Erro na geração");
      return { error: err };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credits, heygenConfig]);

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
  const loadScriptFromState = React.useCallback((s: { script?: string; theme?: string; audience?: string; estimated_seconds?: number } | null) => {
    if (!s) return;
    if (s.script) {
      setScript(s.script);
      setTheme(s.theme ?? "");
      setAudience(s.audience ?? "");
      setEstimatedSeconds(s.estimated_seconds ?? estimateSecondsFromText(s.script));
      setState("approval");
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
    setState("input");
  }, []);

  return {
    state,
    checking: state === "checking",
    blocked_plan: state === "blocked_plan",
    blocked_heygen: state === "blocked_heygen",
    input: state === "input",
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

    loadScriptFromState,
    generateVideo,
    cancelGeneration,
    reset,
  };
}