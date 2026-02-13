import * as React from "react";
import { createVideoRecord, uploadVideoToStorage, updateVideoStatus, updateVideoDescriptions, getVideoById } from "../services/videos/index";
import { useAuthStore } from "../stores/authStore";
import { showSuccess, showError, showLoading, dismissToast } from "../utils/toast";

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
      setUploadProgress(5);

      try {
        const { data: videoRecord, error: createErr } = await createVideoRecord(orgId, userId);
        if (createErr || !videoRecord) {
          throw createErr ?? new Error("Falha ao criar registro do vídeo");
        }
        setVideoId(videoRecord.id);

        // Upload to storage (note: supabase JS doesn't provide progress callbacks reliably; we simulate progress)
        const toastId = showLoading("Fazendo upload do vídeo...");
        // Simulate progress
        const fakeProgressInterval = setInterval(() => {
          setUploadProgress((p) => Math.min(95, p + Math.floor(Math.random() * 12)));
        }, 400);

        const { data: publicUrl, error: uploadErr } = await uploadVideoToStorage(file, orgId, videoRecord.id);
        clearInterval(fakeProgressInterval);
        setUploadProgress(100);
        dismissToast(toastId);

        if (uploadErr || !publicUrl) {
          throw uploadErr ?? new Error("Falha no upload para storage");
        }

        // Update record with raw url and set status processing
        await updateVideoStatus(videoRecord.id, { video_raw_url: publicUrl, status: "processing" });
        setStatus("processing");
        showSuccess("Upload concluído — processando vídeo...");

        // MOCK: simulate backend processing (e.g., OpusClip adding captions) — after 3s -> ready
        setTimeout(async () => {
          const processedUrl = publicUrl;
          const captions = [
            { start: 0, end: 2, text: "Legenda 1" },
            { start: 3, end: 6, text: "Legenda 2" },
          ];
          const descriptions = {
            instagram: "Descrição gerada por IA para Instagram (mock).",
            tiktok: "Descrição gerada por IA para TikTok (mock).",
            facebook: "Descrição gerada por IA para Facebook (mock).",
          };

          await updateVideoStatus(videoRecord.id, {
            video_processed_url: processedUrl,
            captions,
            status: "ready",
          });

          setVideoData({
            id: videoRecord.id,
            video_processed_url: processedUrl,
            video_raw_url: publicUrl,
            captions,
            descriptions,
          });

          setStatus("ready");
          setUploadProgress(100);
          showSuccess("Vídeo processado com sucesso!");
        }, 3000);
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
      const { data, error: gErr } = await getVideoById(id);
      if (gErr || !data) {
        setError(gErr?.message ?? "Vídeo não encontrado");
        return;
      }
      setVideoId(id);
      setVideoData({
        ...data,
      });
      setStatus((data.status ?? "idle") as Status);
    },
    [],
  );

  const saveDescriptions = React.useCallback(
    async (descriptions: Record<string, string>) => {
      if (!videoId) {
        showError("Nenhum vídeo selecionado");
        return;
      }
      const toastId = showLoading("Salvando descrições...");
      const { data, error: upError } = await updateVideoDescriptions(videoId, descriptions);
      dismissToast(toastId);
      if (upError) {
        showError("Erro ao salvar descrições");
        return { error: upError };
      }
      setVideoData((prev: any) => ({ ...(prev ?? {}), descriptions }));
      showSuccess("✅ Vídeo salvo com sucesso!");
      return { data };
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