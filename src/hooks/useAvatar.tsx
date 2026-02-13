import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { useAuthStore } from "../stores/authStore";
import { updateVideoWithAvatar, saveGeneratedVideo, incrementCreditsUsed } from "../services/avatar";
import { showLoading, dismissToast, showSuccess, showError } from "../utils/toast";

export type Avatar = {
  id: string;
  name: string;
  gender: string;
  style: string;
  age: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  language?: string;
  recommended?: boolean;
};

export type Voice = {
  id: string;
  name: string;
  gender: string;
  tone: string;
  speed: string;
  sampleUrl?: string;
  language?: string;
  recommended?: boolean;
};

const MOCK_AVATARS: Avatar[] = [
  {
    id: "avatar_001",
    name: "Maria Silva",
    gender: "female",
    style: "professional",
    age: "adult",
    thumbnailUrl: "https://via.placeholder.com/160x160.png?text=Maria",
    previewVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    language: "pt-BR",
    recommended: true,
  },
  {
    id: "avatar_002",
    name: "João Santos",
    gender: "male",
    style: "casual",
    age: "young",
    thumbnailUrl: "https://via.placeholder.com/160x160.png?text=João",
    previewVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    language: "pt-BR",
    recommended: true,
  },
];

const MOCK_VOICES: Voice[] = [
  {
    id: "voice_pt_001",
    name: "Juliana",
    gender: "female",
    tone: "natural_friendly",
    speed: "medium",
    sampleUrl: "",
    language: "pt-BR",
    recommended: true,
  },
  {
    id: "voice_pt_002",
    name: "Fernanda",
    gender: "female",
    tone: "professional_clear",
    speed: "medium_fast",
    sampleUrl: "",
    language: "pt-BR",
  },
];

export function useAvatar(initialVideoId?: string | null) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organization_id ?? "";

  const [step, setStep] = React.useState<number>(1);
  const [videoId, setVideoId] = React.useState<string | null>(initialVideoId ?? null);
  const [script, setScript] = React.useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = React.useState<Avatar | null>(MOCK_AVATARS[0]);
  const [selectedVoice, setSelectedVoice] = React.useState<Voice | null>(MOCK_VOICES[0]);
  const [settings, setSettings] = React.useState<any>({ ratio: "16:9", subtitles: true });
  const [status, setStatus] = React.useState<"idle" | "generating" | "ready" | "error">("idle");
  const [progress, setProgress] = React.useState<number>(0);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [credits, setCredits] = React.useState<{ used: number; total: number }>({ used: 7, total: 30 });
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      if (!videoId) {
        const params = new URLSearchParams(location.search);
        const q = params.get("video_id");
        if (q) setVideoId(q);
        return;
      }
      try {
        const res: any = await supabase.from("videos").select("script").eq("id", videoId).single();
        if (!res.error && res.data) {
          setScript(res.data.script ?? "");
        }
      } catch (e) {
        // ignore
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  React.useEffect(() => {
    async function loadOrg() {
      if (!orgId) return;
      try {
        const res: any = await supabase.from("organizations").select("heygen_credits_used,heygen_credits_total,plan").eq("id", orgId).single();
        if (!res.error && res.data) {
          const used = res.data.heygen_credits_used ?? 7;
          const total = res.data.heygen_credits_total ?? 30;
          setCredits({ used, total });
        }
      } catch (e) {
        // ignore; keep mock
      }
    }
    loadOrg();
  }, [orgId]);

  const remainingCredits = credits.total - credits.used;

  const generateVideo = React.useCallback(async () => {
    if (!videoId) {
      showError("Vídeo não selecionado (video_id ausente). Crie um rascunho primeiro.");
      return;
    }
    if (!selectedAvatar || !selectedVoice) {
      showError("Selecione avatar e voz");
      return;
    }
    if (remainingCredits <= 0) {
      showError("Créditos insuficientes para gerar vídeo");
      return;
    }

    setStatus("generating");
    setProgress(0);
    const toastId = showLoading("Gerando vídeo com Avatar...");
    try {
      await updateVideoWithAvatar(videoId, selectedAvatar.id, selectedVoice.id, settings);

      let current = 0;
      const interval = setInterval(() => {
        current += Math.floor(Math.random() * 15) + 8;
        if (current >= 100) current = 100;
        setProgress(current);
        if (current >= 100) {
          clearInterval(interval);
          const MOCK_VIDEO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
          setVideoUrl(MOCK_VIDEO_URL);
          setStatus("ready");
          dismissToast(toastId);
          showSuccess("✅ Vídeo gerado (mock)");
          setCredits((c) => ({ ...c, used: c.used + 1 }));
          saveGeneratedVideo(videoId, MOCK_VIDEO_URL).catch(() => null);
          incrementCreditsUsed(orgId).catch(() => null);
          setStep(5);
        }
      }, 1000);
    } catch (err: any) {
      dismissToast(toastId);
      setStatus("error");
      setError(err?.message ?? "Erro ao gerar vídeo");
      showError(err?.message ?? "Erro ao gerar vídeo");
    }
  }, [videoId, selectedAvatar, selectedVoice, settings, orgId, remainingCredits]);

  return {
    step,
    setStep,
    videoId,
    setVideoId,
    script,
    setScript,
    selectedAvatar,
    setSelectedAvatar,
    selectedVoice,
    setSelectedVoice,
    settings,
    setSettings,
    status,
    progress,
    videoUrl,
    credits,
    remainingCredits,
    error,
    generateVideo,
  };
}