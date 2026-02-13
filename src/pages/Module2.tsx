import React from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import VideoUpload from "@/components/modules/VideoUpload";
import VideoPreview from "@/components/modules/VideoPreview";
import DescriptionEditor from "@/components/modules/DescriptionEditor";
import { useVideoUpload } from "../hooks/useVideoUpload";
import { useAuth } from "@/hooks/useAuth";

const Module2Page: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    videoId,
    uploadProgress,
    status,
    error,
    videoData,
    uploadVideo,
    saveDescriptions,
    loadVideoData,
  } = useVideoUpload();

  const [step, setStep] = React.useState<number>(1);

  React.useEffect(() => {
    // if there is already a videoId in query/local state we could load it
    // for now, stay simple
  }, []);

  const handleFileSelected = async (file: File) => {
    await uploadVideo(file);
    setStep(2);
  };

  const handleCancelUpload = () => {
    // For now, simply reset — more sophisticated cleanup can be added
    window.location.reload();
  };

  const handleNextFromPreview = () => {
    setStep(3);
  };

  const handleSaveDescriptions = async (descriptions: any) => {
    const res = await saveDescriptions(descriptions);
    if ((res as any)?.error) return;
    // After saving, navigate to dashboard or calendar
    navigate("/dashboard");
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/dashboard" className="text-sm text-slate-500 underline">← Voltar</Link>
            <h1 className="text-2xl font-bold mt-2">⚡ PostRápido</h1>
            <p className="text-sm text-slate-500 mt-1">Upload, legendas e agendamento</p>
          </div>
          <div className="text-sm text-slate-500">Passo {step} de 3</div>
        </div>

        {/* Stepper */}
        <div className="flex gap-2 items-center">
          <div className={`px-3 py-1 rounded ${step === 1 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>1. Upload</div>
          <div className={`px-3 py-1 rounded ${step === 2 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>2. Preview</div>
          <div className={`px-3 py-1 rounded ${step === 3 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>3. Edição</div>
        </div>

        {/* Content */}
        <div>
          {step === 1 && (
            <VideoUpload
              onFileSelected={handleFileSelected}
              uploading={status === "uploading"}
              progress={uploadProgress}
              onCancel={handleCancelUpload}
              error={error}
            />
          )}

          {step === 2 && (
            <VideoPreview
              processedUrl={videoData?.video_processed_url ?? videoData?.video_raw_url ?? null}
              duration={videoData?.duration_seconds ? `${Math.round((videoData.duration_seconds ?? 0) / 60)}:${(videoData.duration_seconds ?? 0) % 60}` : undefined}
              size={undefined}
              onNewUpload={() => {
                if (confirm("Fazer novo upload descartará o atual. Continuar?")) {
                  setStep(1);
                }
              }}
              onNext={handleNextFromPreview}
            />
          )}

          {step === 3 && (
            <DescriptionEditor
              initial={videoData?.descriptions ?? {
                instagram: videoData?.descriptions?.instagram ?? "",
                tiktok: videoData?.descriptions?.tiktok ?? "",
                facebook: videoData?.descriptions?.facebook ?? "",
              }}
              onSave={handleSaveDescriptions}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Module2Page;