import * as React from "react";
import { createVideoRecord, uploadVideoToStorage, updateVideoStatus, updateVideoDescriptions, getVideoById } from "../services/videos";
import { useAuthStore } from "../stores/authStore";
import { showSuccess, showError, showLoading, dismissToast } from "../utils/toast";
import { api } from "@/lib/api";

type Status = "idle" | "uploading" | "processing" | "ready" | "error";

export function useVideoUpload() {
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organization_id;
  const userId = user?.id;

  const [videoId, setVideoId] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [videoData, setVideoData] = React.useState<any | null>(null);

  const uploadVideo = React.useCallback(
    async (file: File) => {
      if (!orgId || !userId) {
        showError("Usuário ou organização não encontrados");
        return;
      }

      setError(null);
      setStatus("uploading");
      setUploadProgress(2);

      try {
        // 1. Upload do vídeo via API
        const toastId = showLoading("Fazendo upload do vídeo...");
        
        // Simular progresso de upload
        let uploadCurrent = 2;
        const uploadInterval = setInterval(() => {
          uploadCurrent = Math.min(95, uploadCurrent + Math.floor(Math.random() * 12) + 3);
          setUploadProgress(uploadCurrent);
        }, 400);

        const uploadResponse = await api.postrapido.upload(file, file.name);
        clearInterval(uploadInterval);
        setUploadProgress(100);
        dismissToast(toastId);

        setVideoId(uploadResponse.videoId);
        showSuccess("Upload concluído!");

        // 2. Transcrever vídeo
        setStatus("processing");
        setUploadProgress(0);
        const transcribeToast = showLoading("Transcrevendo vídeo...");
        
        const transcriptionResponse = await api.postrapido.transcribe({
          videoId: uploadResponse.videoId,
          language: "pt",
        });
        
        dismissToast(transcribeToast);
        showSuccess("Transcrição concluída!");

        // 3. Gerar descrições para plataformas
        const descToast = showLoading("Gerando descrições com IA...");
        
        const descriptionsResponse = await api.postrapido.generateDescriptions({
          videoId: uploadResponse.videoId,
          platforms: ["instagram", "tiktok", "facebook", "linkedin"],
          tone: "professional",
          includeHashtags: true,
        });
        
        dismissToast(descToast);

        // 4. Atualizar estado com dados completos
        setVideoData({
          id: uploadResponse.videoId,
          video_processed_url: uploadResponse.url,
          video_raw_url: uploadResponse.url,
          transcription: transcriptionResponse.transcription,
          descriptions: descriptionsResponse.descriptions,
          duration_seconds: 60, // Placeholder - seria retornado pela API
        });

        setStatus("ready");
        setUploadProgress(100);
        showSuccess("Vídeo processado com sucesso!");
      } catch (err: any) {
        console.error("Upload error", err);
        setStatus("error");
        setError(err?.message ?? "Erro ao fazer upload");
        showError(err?.message ?? "Erro ao fazer upload");
      }
    },
    [orgId, userId],
  );

  const loadVideoData = React.useCallback(
    async (id: string) => {
      try {
        // Carregar dados do vídeo via API (se houver endpoint específico)
        // Por enquanto, mantemos compatibilidade com serviço existente
        const { data, error: gErr } = await getVideoById(id);
        if (gErr || !data) {
          setError(gErr?.message ?? "Vídeo não encontrado");
          return;
        }
        setVideoId(id);
        setVideoData({ ...(data as any) });
        setStatus(((data as any).status ?? "idle") as Status);
      } catch (err: any) {
        console.error("Erro ao carregar vídeo:", err);
        setError(err?.message ?? "Erro ao carregar vídeo");
      }
    },
    [],
  );

  const saveDescriptions = React.useCallback(
    async (descriptions: Record<string, string>) => {
      if (!videoId) {
        showError("Nenhum vídeo selecionado");
        return { error: new Error("Nenhum vídeo selecionado") };
      }
      
      const toastId = showLoading("Agendando posts...");
      
      try {
        // Agendar posts para cada plataforma
        const schedules = Object.entries(descriptions).map(([platform, description]) => ({
          platform: platform as any,
          description,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h a partir de agora
        }));

        const response = await api.postrapido.schedule({
          videoId,
          schedules,
        });

        dismissToast(toastId);
        
        if (response.success) {
          setVideoData((prev: any) => ({ ...(prev ?? {}), descriptions }));
          showSuccess(`✅ ${response.scheduled_posts.length} posts agendados com sucesso!`);
          return { data: response };
        } else {
          throw new Error("Erro ao agendar posts");
        }
      } catch (err: any) {
        dismissToast(toastId);
        console.error("Erro ao salvar descrições:", err);
        showError(err?.message ?? "Erro ao agendar posts");
        return { error: err };
      }
    },
    [videoId],
  );

  return {
    videoId,
    uploadProgress,
    status,
    error,
    videoData,
    uploadVideo,
    loadVideoData,
    saveDescriptions,
    setStatus,
    setVideoData,
  };
}