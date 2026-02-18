import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import PostConfigStep from "@/components/modules/PostConfigStep";
import MediaUpload from "@/components/modules/MediaUpload";
import VideoPreview from "@/components/modules/VideoPreview";
import CarouselPreview from "@/components/modules/CarouselPreview";
import DescriptionEditor from "@/components/modules/DescriptionEditor";
import ScheduleStep from "@/components/modules/ScheduleStep";
import { useMediaUpload } from "../hooks/useMediaUpload";
import { useAuth } from "@/hooks/useAuth";
import type { PostType, AspectRatio, Platform } from "@/lib/compatibility";

const Module2Page: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    mediaId,
    uploadProgress,
    status,
    error,
    mediaData,
    postType,
    aspectRatio,
    selectedPlatforms,
    setPostType,
    setAspectRatio,
    setSelectedPlatforms,
    uploadVideo,
    uploadImage,
    uploadCarousel,
    saveDescriptions,
    schedulePosts,
    reset,
  } = useMediaUpload();

  const [step, setStep] = React.useState<number>(0);
  const [carouselFiles, setCarouselFiles] = React.useState<Array<{
    file: File;
    preview: string;
    order: number;
    altText?: string;
  }>>([]);

  // Detectar se veio do teleprompter
  React.useEffect(() => {
    const state = location.state as any;
    if (state?.fromTeleprompter && state?.videoId) {
      // Configurar dados do teleprompter
      setPostType("video");
      if (state.aspectRatio) setAspectRatio(state.aspectRatio);
      if (state.selectedPlatforms) setSelectedPlatforms(state.selectedPlatforms);
      
      // Pular para step 2 (preview) já que vídeo já existe
      setStep(2);
    }
  }, [location.state, setPostType, setAspectRatio, setSelectedPlatforms]);

  // Handlers para PostConfigStep
  const handleConfigComplete = (config: {
    postType: PostType;
    aspectRatio?: AspectRatio;
    platforms: Platform[];
  }) => {
    setPostType(config.postType);
    if (config.aspectRatio) {
      setAspectRatio(config.aspectRatio);
    }
    setSelectedPlatforms(config.platforms);
    setStep(1);
  };

  // Handlers para MediaUpload
  const handleMediaSelected = async (files: File | File[]) => {
    if (!postType) return;

    if (postType === "video") {
      await uploadVideo(files as File);
      setStep(2); // Avançar para Preview
    } else if (postType === "image") {
      await uploadImage(files as File);
      setStep(2); // Avançar para Preview
    } else if (postType === "carousel") {
      // Armazenar arquivos para preview/edição
      const filesArray = Array.isArray(files) ? files : [files];
      const mediaFiles = filesArray.map((file, index) => ({
        file,
        preview: URL.createObjectURL(file),
        order: index,
        altText: "",
      }));
      setCarouselFiles(mediaFiles);
      setStep(2); // Avançar para CarouselPreview
    }
  };

  const handleCancelUpload = () => {
    if (confirm("Descartar upload e recomeçar?")) {
      reset();
      setStep(0);
      setCarouselFiles([]);
    }
  };

  // Handlers para CarouselPreview
  const handleCarouselConfirm = async (files: typeof carouselFiles) => {
    await uploadCarousel(files);
    setStep(3); // Avançar para DescriptionEditor
  };

  // Handlers para Preview
  const handleNextFromPreview = () => {
    setStep(3); // Avançar para DescriptionEditor
  };

  // Handlers para DescriptionEditor
  const handleSaveDescriptions = async (descriptions: Record<string, string>) => {
    const res = await saveDescriptions(descriptions);
    if (res?.error) return;
    setStep(4); // Avançar para ScheduleStep
  };

  // Handlers para ScheduleStep
  const handleSchedule = async (config: any) => {
    const res = await schedulePosts(config);
    if (res?.error) return;
    // Sucesso - navegar para dashboard
    navigate("/dashboard");
  };

  // Build platforms list para DescriptionEditor
  const platformsForEditor = React.useMemo(() => {
    if (!selectedPlatforms || selectedPlatforms.length === 0) {
      return [];
    }
    return selectedPlatforms.map((platform) => ({
      key: platform,
      label: platform === "x" ? "X" : platform.charAt(0).toUpperCase() + platform.slice(1),
    }));
  }, [selectedPlatforms]);

  // Total de steps
  const totalSteps = 5; // 0: Config, 1: Upload, 2: Preview, 3: Descrições, 4: Agendamento

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/dashboard" className="text-sm text-slate-500 underline">← Voltar</Link>
            <h1 className="text-2xl font-bold mt-2">⚡ PostRápido</h1>
            <p className="text-sm text-slate-500 mt-1">
              {postType === "video" && "Vídeo"}
              {postType === "image" && "Imagem"}
              {postType === "carousel" && "Carrossel"}
              {!postType && "Escolha o tipo de post"}
              {aspectRatio && ` • ${aspectRatio}`}
            </p>
          </div>
          <div className="text-sm text-slate-500">Passo {step + 1} de {totalSteps}</div>
        </div>

        {/* Stepper */}
        <div className="flex gap-2 items-center overflow-x-auto pb-2">
          <button 
            onClick={() => setStep(0)}
            disabled={step > 0}
            className={`px-3 py-1 rounded whitespace-nowrap text-sm ${
              step === 0 ? "bg-indigo-600 text-white" : step > 0 ? "bg-green-100 text-green-700" : "bg-gray-100"
            }`}
          >
            {step > 0 ? "✓" : "0."} Configuração
          </button>
          <button 
            onClick={() => postType && setStep(1)}
            disabled={!postType || step > 1}
            className={`px-3 py-1 rounded whitespace-nowrap text-sm ${
              step === 1 ? "bg-indigo-600 text-white" : step > 1 ? "bg-green-100 text-green-700" : "bg-gray-100"
            }`}
          >
            {step > 1 ? "✓" : "1."} Upload
          </button>
          <button 
            onClick={() => mediaData && setStep(2)}
            disabled={!mediaData || step > 2}
            className={`px-3 py-1 rounded whitespace-nowrap text-sm ${
              step === 2 ? "bg-indigo-600 text-white" : step > 2 ? "bg-green-100 text-green-700" : "bg-gray-100"
            }`}
          >
            {step > 2 ? "✓" : "2."} Preview
          </button>
          <button 
            onClick={() => mediaData && setStep(3)}
            disabled={!mediaData || step > 3}
            className={`px-3 py-1 rounded whitespace-nowrap text-sm ${
              step === 3 ? "bg-indigo-600 text-white" : step > 3 ? "bg-green-100 text-green-700" : "bg-gray-100"
            }`}
          >
            {step > 3 ? "✓" : "3."} Descrições
          </button>
          <button 
            onClick={() => mediaData?.descriptions && setStep(4)}
            disabled={!mediaData?.descriptions}
            className={`px-3 py-1 rounded whitespace-nowrap text-sm ${
              step === 4 ? "bg-indigo-600 text-white" : "bg-gray-100"
            }`}
          >
            4. Agendamento
          </button>
        </div>

        {/* Content */}
        <div>
          {step === 0 && (
            <PostConfigStep
              onComplete={handleConfigComplete}
            />
          )}

          {step === 1 && postType && (
            <MediaUpload
              postType={postType}
              aspectRatio={aspectRatio}
              onFilesSelected={handleMediaSelected}
              status={status}
              progress={uploadProgress}
              onCancel={handleCancelUpload}
              error={error}
            />
          )}

          {step === 2 && postType === "carousel" && carouselFiles.length > 0 && (
            <CarouselPreview
              images={carouselFiles}
              onConfirm={handleCarouselConfirm}
              onBack={() => setStep(1)}
            />
          )}

          {step === 2 && postType !== "carousel" && mediaData && (
            <VideoPreview
              processedUrl={mediaData.url ?? null}
              duration={mediaData.durationSeconds ? `${Math.floor(mediaData.durationSeconds / 60)}:${(mediaData.durationSeconds % 60).toString().padStart(2, "0")}` : undefined}
              size={undefined}
              onNewUpload={() => {
                if (confirm("Fazer novo upload descartará o atual. Continuar?")) {
                  reset();
                  setStep(0);
                }
              }}
              onNext={handleNextFromPreview}
            />
          )}

          {step === 3 && mediaData && (
            <DescriptionEditor
              platforms={platformsForEditor}
              initial={mediaData.descriptions ?? {}}
              onSave={handleSaveDescriptions}
              onBack={() => setStep(2)}
            />
          )}

          {step === 4 && mediaData?.descriptions && (
            <ScheduleStep
              platforms={selectedPlatforms}
              descriptions={mediaData.descriptions}
              onSchedule={handleSchedule}
              onBack={() => setStep(3)}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Module2Page;