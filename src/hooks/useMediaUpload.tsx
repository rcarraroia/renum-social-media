import * as React from "react";
import { useAuthStore } from "../stores/authStore";
import { showSuccess, showError, showLoading, dismissToast } from "../utils/toast";
import { api } from "@/lib/api";
import type { PostType, AspectRatio, Platform } from "@/lib/compatibility";

type Status = "idle" | "uploading" | "processing" | "ready" | "error";

interface MediaFile {
  file: File;
  preview: string;
  order: number;
  altText?: string;
}

interface MediaData {
  id: string;
  type: PostType;
  aspectRatio?: AspectRatio;
  platforms: Platform[];
  url?: string; // Para vídeo ou imagem única
  images?: Array<{
    url: string;
    order: number;
    altText?: string;
    sizeMb: number;
  }>; // Para carrossel
  transcription?: string;
  descriptions?: Record<string, string>;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

export function useMediaUpload() {
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organization_id;
  const userId = user?.id;

  const [mediaId, setMediaId] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [mediaData, setMediaData] = React.useState<MediaData | null>(null);

  // Configuração do post (tipo, proporção, plataformas)
  const [postType, setPostType] = React.useState<PostType | null>(null);
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>([]);

  // Upload de vídeo único
  const uploadVideo = React.useCallback(
    async (file: File) => {
      if (!orgId || !userId) {
        showError("Usuário ou organização não encontrados");
        return;
      }

      if (!postType || !aspectRatio || selectedPlatforms.length === 0) {
        showError("Configure o tipo, proporção e plataformas antes do upload");
        return;
      }

      setError(null);
      setStatus("uploading");
      setUploadProgress(2);

      try {
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

        setMediaId(uploadResponse.videoId);
        showSuccess("Upload concluído!");

        // Transcrever vídeo
        setStatus("processing");
        setUploadProgress(0);
        const transcribeToast = showLoading("Transcrevendo vídeo...");
        
        const transcriptionResponse = await api.postrapido.transcribe({
          videoId: uploadResponse.videoId,
          language: "pt",
        });
        
        dismissToast(transcribeToast);
        showSuccess("Transcrição concluída!");

        // Gerar descrições para plataformas selecionadas
        const descToast = showLoading("Gerando descrições com IA...");
        
        // Converter Platform[] para SocialPlatform[] (filtrar apenas plataformas suportadas pela API)
        const supportedPlatforms = selectedPlatforms.filter(p => 
          ['instagram', 'tiktok', 'linkedin', 'facebook', 'x', 'youtube'].includes(p)
        ) as any[];
        
        const descriptionsResponse = await api.postrapido.generateDescriptions({
          videoId: uploadResponse.videoId,
          platforms: supportedPlatforms,
          tone: "professional",
          includeHashtags: true,
        });
        
        dismissToast(descToast);

        // Atualizar estado com dados completos + metadata
        setMediaData({
          id: uploadResponse.videoId,
          type: postType,
          aspectRatio,
          platforms: selectedPlatforms,
          url: uploadResponse.url,
          transcription: transcriptionResponse.transcription,
          descriptions: descriptionsResponse.descriptions,
          durationSeconds: 60, // Placeholder
          metadata: {
            post_type: postType,
            aspect_ratio: aspectRatio,
            platforms: selectedPlatforms,
            uploaded_at: new Date().toISOString(),
          },
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
    [orgId, userId, postType, aspectRatio, selectedPlatforms],
  );

  // Upload de imagem única
  const uploadImage = React.useCallback(
    async (file: File) => {
      if (!orgId || !userId) {
        showError("Usuário ou organização não encontrados");
        return;
      }

      if (!postType || selectedPlatforms.length === 0) {
        showError("Configure o tipo e plataformas antes do upload");
        return;
      }

      setError(null);
      setStatus("uploading");
      setUploadProgress(2);

      try {
        const toastId = showLoading("Fazendo upload da imagem...");
        
        let uploadCurrent = 2;
        const uploadInterval = setInterval(() => {
          uploadCurrent = Math.min(95, uploadCurrent + Math.floor(Math.random() * 15) + 5);
          setUploadProgress(uploadCurrent);
        }, 300);

        // TODO: Implementar endpoint específico para imagens
        // Por enquanto, usar o mesmo endpoint de vídeo
        const uploadResponse = await api.postrapido.upload(file, file.name);
        clearInterval(uploadInterval);
        setUploadProgress(100);
        dismissToast(toastId);

        setMediaId(uploadResponse.videoId);

        // Gerar descrições
        setStatus("processing");
        const descToast = showLoading("Gerando descrições com IA...");
        
        // Converter Platform[] para SocialPlatform[]
        const supportedPlatforms = selectedPlatforms.filter(p => 
          ['instagram', 'tiktok', 'linkedin', 'facebook', 'x', 'youtube'].includes(p)
        ) as any[];
        
        const descriptionsResponse = await api.postrapido.generateDescriptions({
          videoId: uploadResponse.videoId,
          platforms: supportedPlatforms,
          tone: "professional",
          includeHashtags: true,
        });
        
        dismissToast(descToast);

        setMediaData({
          id: uploadResponse.videoId,
          type: postType,
          platforms: selectedPlatforms,
          url: uploadResponse.url,
          descriptions: descriptionsResponse.descriptions,
          metadata: {
            post_type: postType,
            platforms: selectedPlatforms,
            uploaded_at: new Date().toISOString(),
          },
        });

        setStatus("ready");
        showSuccess("Imagem processada com sucesso!");
      } catch (err: any) {
        console.error("Upload error", err);
        setStatus("error");
        setError(err?.message ?? "Erro ao fazer upload");
        showError(err?.message ?? "Erro ao fazer upload");
      }
    },
    [orgId, userId, postType, selectedPlatforms],
  );

  // Upload de carrossel (múltiplas imagens)
  const uploadCarousel = React.useCallback(
    async (files: MediaFile[]) => {
      if (!orgId || !userId) {
        showError("Usuário ou organização não encontrados");
        return;
      }

      if (!postType || selectedPlatforms.length === 0) {
        showError("Configure o tipo e plataformas antes do upload");
        return;
      }

      if (files.length < 2 || files.length > 10) {
        showError("Carrossel deve ter entre 2 e 10 imagens");
        return;
      }

      setError(null);
      setStatus("uploading");
      setUploadProgress(0);

      try {
        const toastId = showLoading(`Fazendo upload de ${files.length} imagens...`);
        
        const uploadedImages: MediaData["images"] = [];
        const totalFiles = files.length;

        // Upload sequencial de cada imagem
        for (let i = 0; i < files.length; i++) {
          const mediaFile = files[i];
          setUploadProgress(Math.floor(((i + 1) / totalFiles) * 100));

          // TODO: Implementar endpoint específico para carrossel
          const uploadResponse = await api.postrapido.upload(mediaFile.file, mediaFile.file.name);
          
          uploadedImages.push({
            url: uploadResponse.url,
            order: mediaFile.order,
            altText: mediaFile.altText,
            sizeMb: mediaFile.file.size / (1024 * 1024),
          });
        }

        dismissToast(toastId);
        
        // Usar o ID da primeira imagem como ID do carrossel
        const carouselId = uploadedImages[0]?.url.split("/").pop() ?? `carousel-${Date.now()}`;
        setMediaId(carouselId);

        // Gerar descrições
        setStatus("processing");
        const descToast = showLoading("Gerando descrições com IA...");
        
        // Converter Platform[] para SocialPlatform[]
        const supportedPlatforms = selectedPlatforms.filter(p => 
          ['instagram', 'tiktok', 'linkedin', 'facebook', 'x', 'youtube'].includes(p)
        ) as any[];
        
        // TODO: Adaptar API para aceitar carrossel
        const descriptionsResponse = await api.postrapido.generateDescriptions({
          videoId: carouselId,
          platforms: supportedPlatforms,
          tone: "professional",
          includeHashtags: true,
        });
        
        dismissToast(descToast);

        setMediaData({
          id: carouselId,
          type: postType,
          platforms: selectedPlatforms,
          images: uploadedImages,
          descriptions: descriptionsResponse.descriptions,
          metadata: {
            post_type: postType,
            platforms: selectedPlatforms,
            images: uploadedImages,
            uploaded_at: new Date().toISOString(),
          },
        });

        setStatus("ready");
        showSuccess(`Carrossel com ${files.length} imagens processado!`);
      } catch (err: any) {
        console.error("Upload error", err);
        setStatus("error");
        setError(err?.message ?? "Erro ao fazer upload");
        showError(err?.message ?? "Erro ao fazer upload");
      }
    },
    [orgId, userId, postType, selectedPlatforms],
  );

  // Salvar descrições (SEM agendamento automático)
  const saveDescriptions = React.useCallback(
    async (descriptions: Record<string, string>) => {
      if (!mediaId) {
        showError("Nenhuma mídia selecionada");
        return { error: new Error("Nenhuma mídia selecionada") };
      }
      
      try {
        // Apenas atualizar o estado local
        // O agendamento será feito no ScheduleStep
        setMediaData((prev) => prev ? { ...prev, descriptions } : null);
        showSuccess("Descrições salvas!");
        return { data: { success: true } };
      } catch (err: any) {
        console.error("Erro ao salvar descrições:", err);
        showError(err?.message ?? "Erro ao salvar descrições");
        return { error: err };
      }
    },
    [mediaId],
  );

  // Agendar posts (será chamado pelo ScheduleStep)
  const schedulePosts = React.useCallback(
    async (scheduleConfig: {
      mode: "now" | "scheduled" | "ai";
      scheduledAt?: string;
      descriptions: Record<string, string>;
    }) => {
      if (!mediaId || !mediaData) {
        showError("Nenhuma mídia selecionada");
        return { error: new Error("Nenhuma mídia selecionada") };
      }

      const toastId = showLoading("Agendando posts...");
      
      try {
        // Converter Platform para SocialPlatform e filtrar apenas plataformas suportadas
        const schedules = Object.entries(scheduleConfig.descriptions)
          .filter(([platform]) => ['instagram', 'tiktok', 'linkedin', 'facebook', 'x', 'youtube'].includes(platform))
          .map(([platform, description]) => ({
            platform: platform as any,
            description,
            scheduledAt: scheduleConfig.mode === "now" 
              ? new Date().toISOString()
              : scheduleConfig.scheduledAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }));

        const response = await api.postrapido.schedule({
          videoId: mediaId,
          schedules,
        });

        dismissToast(toastId);
        
        if (response.success) {
          showSuccess(`✅ ${response.scheduled_posts.length} posts agendados com sucesso!`);
          return { data: response };
        } else {
          throw new Error("Erro ao agendar posts");
        }
      } catch (err: any) {
        dismissToast(toastId);
        console.error("Erro ao agendar posts:", err);
        showError(err?.message ?? "Erro ao agendar posts");
        return { error: err };
      }
    },
    [mediaId, mediaData],
  );

  // Reset completo
  const reset = React.useCallback(() => {
    setMediaId(null);
    setUploadProgress(0);
    setStatus("idle");
    setError(null);
    setMediaData(null);
    setPostType(null);
    setAspectRatio(null);
    setSelectedPlatforms([]);
  }, []);

  return {
    // State
    mediaId,
    uploadProgress,
    status,
    error,
    mediaData,
    postType,
    aspectRatio,
    selectedPlatforms,
    
    // Setters
    setPostType,
    setAspectRatio,
    setSelectedPlatforms,
    setStatus,
    setMediaData,
    
    // Actions
    uploadVideo,
    uploadImage,
    uploadCarousel,
    saveDescriptions,
    schedulePosts,
    reset,
  };
}
