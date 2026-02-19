import * as React from "react";
import { createVideoRecord, uploadVideoToStorage, updateVideoStatus } from "../services/videos";
import { useAuthStore } from "../stores/authStore";
import { showSuccess, showError, showLoading, dismissToast } from "../utils/toast";
import type { AspectRatio, Platform } from "@/lib/compatibility";

interface TeleprompterMetadata {
  aspectRatio: AspectRatio;
  selectedPlatforms: Platform[];
  script: string;
  theme?: string;
  audience?: string;
  durationSeconds?: number;
}

export function useTeleprompter() {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;
  const userId = user?.id;

  const [uploading, setUploading] = React.useState(false);
  const [videoId, setVideoId] = React.useState<string | null>(null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const saveVideo = React.useCallback(
    async (blob: Blob, metadata: TeleprompterMetadata) => {
      if (!orgId || !userId) {
        showError("Usuário não autenticado");
        return null;
      }

      setUploading(true);
      setError(null);
      const toastId = showLoading("Salvando vídeo...");

      try {
        // 1. Create video record
        const { data: videoRecord, error: createError } = await createVideoRecord(orgId, userId);
        
        if (createError || !videoRecord) {
          throw new Error(createError?.message || "Erro ao criar registro do vídeo");
        }

        const newVideoId = videoRecord.id;
        setVideoId(newVideoId);

        // 2. Convert blob to File
        const file = new File([blob], `teleprompter-${Date.now()}.webm`, { type: "video/webm" });

        // 3. Upload to storage
        const { data: publicUrl, error: uploadError } = await uploadVideoToStorage(file, orgId, newVideoId);

        if (uploadError || !publicUrl) {
          throw new Error(uploadError?.message || "Erro ao fazer upload do vídeo");
        }

        setVideoUrl(publicUrl);

        // 4. Update video record with metadata
        const { error: updateError } = await updateVideoStatus(newVideoId, {
          title: metadata.theme || "Vídeo do Teleprompter",
          script: metadata.script,
          video_raw_url: publicUrl,
          status: "ready",
          module_type: "research", // Teleprompter faz parte do módulo research (ScriptAI)
          recording_source: "teleprompter",
          audience: metadata.audience,
          duration_seconds: metadata.durationSeconds,
          size_mb: (file.size / (1024 * 1024)).toFixed(2),
          metadata: {
            aspectRatio: metadata.aspectRatio,
            selectedPlatforms: metadata.selectedPlatforms,
            recordedAt: new Date().toISOString(),
            recordingMethod: "teleprompter", // Identificador específico
          },
        });

        if (updateError) {
          throw new Error(updateError?.message || "Erro ao atualizar registro do vídeo");
        }

        dismissToast(toastId);
        showSuccess("Vídeo salvo com sucesso!");
        
        return { videoId: newVideoId, videoUrl: publicUrl };
      } catch (err: any) {
        dismissToast(toastId);
        const errorMessage = err?.message || "Erro ao salvar vídeo";
        setError(errorMessage);
        showError(errorMessage);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [orgId, userId]
  );

  const reset = React.useCallback(() => {
    setVideoId(null);
    setVideoUrl(null);
    setError(null);
  }, []);

  return {
    saveVideo,
    reset,
    uploading,
    videoId,
    videoUrl,
    error,
  };
}
