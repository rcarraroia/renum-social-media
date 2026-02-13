import * as React from "react";
import { createVideoRecord, uploadVideoToStorage, updateVideoStatus, updateVideoDescriptions, getVideoById } from "../services/videos";
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
      setUploadProgress(2);

      try {
        const { data: videoRecord, error: createErr } = await createVideoRecord(orgId, userId);
        if (createErr || !videoRecord) {
          throw createErr ?? new Error("Falha ao criar registro do vídeo");
        }
        // videoRecord is any => safe to access .id
        setVideoId(videoRecord.id);

        // Upload to storage
        const toastId = showLoading("Fazendo upload do vídeo...");

        // Simulate upload progress more deterministically
        let uploadCurrent = 2;
        const uploadInterval = setInterval(() => {
          uploadCurrent = Math.min(95, uploadCurrent + Math.floor(Math.random() * 12) + 3);
          setUploadProgress(uploadCurrent);
        }, 400);

        const { data: publicUrl, error: uploadErr } = await uploadVideoToStorage(file, orgId, videoRecord.id);
        clearInterval(uploadInterval);
        setUploadProgress(100);
        dismissToast(toastId);

        if (uploadErr || !publicUrl) {
          throw uploadErr ?? new Error("Falha no upload para storage");
        }

        // Update record with raw url and set status processing
        await updateVideoStatus(videoRecord.id, { video_raw_url: publicUrl, status: "processing" });
        setStatus("processing");
        setUploadProgress(0); // start processing progress

        showSuccess("Upload concluído — processando vídeo...");

        // Simulate processing progress (deterministic)
        let proc = 0;
        const procInterval = setInterval(() => {
          proc = Math.min(100, proc + Math.floor(Math.random() * 18) + 5);
          setUploadProgress(proc);
          if (proc >= 100) {
            clearInterval(procInterval);
          }
        }, 700);

        // MOCK: simulate backend processing (after ~3s -> ready)
        setTimeout(async () => {
          // ensure processing progress reaches 100
          setUploadProgress(100);
          clearInterval(procInterval);

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
      // data is any, safe to spread into an object
      setVideoData({ ...(data as any) });
      setStatus(((data as any).status ?? "idle") as Status);
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