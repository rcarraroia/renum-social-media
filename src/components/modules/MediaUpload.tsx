import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { PostType, AspectRatio } from "@/lib/compatibility";

interface MediaUploadProps {
  postType: PostType;
  aspectRatio?: AspectRatio;
  onFilesSelected: (files: File[]) => void;
  status?: "idle" | "uploading" | "processing" | "ready" | "error";
  progress: number;
  onCancel?: () => void;
  error?: string | null;
}

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CAROUSEL_IMAGES = 10;
const MIN_CAROUSEL_IMAGES = 2;

const MediaUpload: React.FC<MediaUploadProps> = ({
  postType,
  aspectRatio,
  onFilesSelected,
  status = "idle",
  progress,
  onCancel,
  error
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Configuração dinâmica baseada no tipo
  const config = React.useMemo(() => {
    switch (postType) {
      case 'video':
        return {
          accept: {
            "video/mp4": [".mp4"],
            "video/quicktime": [".mov"],
            "video/x-msvideo": [".avi"],
          },
          maxSize: MAX_VIDEO_SIZE,
          multiple: false,
          icon: "📹",
          title: "Arraste seu vídeo aqui ou clique para selecionar",
          subtitle: `Formatos: MP4, MOV, AVI • Máx: 100MB${aspectRatio ? ` • Proporção: ${aspectRatio}` : ''}`,
        };
      case 'image':
        return {
          accept: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/gif": [".gif"],
          },
          maxSize: MAX_IMAGE_SIZE,
          multiple: false,
          icon: "🖼️",
          title: "Arraste sua imagem aqui ou clique para selecionar",
          subtitle: "Formatos: JPG, PNG, GIF • Máx: 10MB",
        };
      case 'carousel':
        return {
          accept: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
          },
          maxSize: MAX_IMAGE_SIZE,
          multiple: true,
          icon: "🎞️",
          title: "Arraste suas imagens aqui ou clique para selecionar",
          subtitle: `Formatos: JPG, PNG • Máx: 10MB por imagem • ${MIN_CAROUSEL_IMAGES}-${MAX_CAROUSEL_IMAGES} imagens`,
        };
    }
  }, [postType, aspectRatio]);

  const onDrop = React.useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      // Validar rejeições
      if (fileRejections?.length) {
        const rej = fileRejections[0];
        if (rej?.file?.size > config.maxSize) {
          const maxMB = config.maxSize / 1024 / 1024;
          return alert(`Arquivo muito grande. Máximo: ${maxMB}MB`);
        }
        return alert(`Formato não suportado. Use ${config.subtitle}`);
      }

      // Validar quantidade para carrossel
      if (postType === 'carousel') {
        const totalFiles = selectedFiles.length + acceptedFiles.length;
        if (totalFiles > MAX_CAROUSEL_IMAGES) {
          return alert(`Máximo de ${MAX_CAROUSEL_IMAGES} imagens permitidas`);
        }
        if (totalFiles < MIN_CAROUSEL_IMAGES && acceptedFiles.length > 0) {
          // Permitir adicionar, mas avisar que precisa de pelo menos 2
          if (totalFiles === 1) {
            alert(`Adicione pelo menos ${MIN_CAROUSEL_IMAGES} imagens para criar um carrossel`);
          }
        }
      }

      // Processar arquivos
      if (postType === 'carousel') {
        // Adicionar às imagens existentes
        const newFiles = [...selectedFiles, ...acceptedFiles];
        setSelectedFiles(newFiles);
        
        // Gerar previews
        const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls([...previewUrls, ...newPreviews]);
      } else {
        // Substituir arquivo único
        const file = acceptedFiles[0];
        if (!file) return;
        
        setSelectedFiles([file]);
        
        // Gerar preview para imagem
        if (postType === 'image') {
          const preview = URL.createObjectURL(file);
          setPreviewUrls([preview]);
        }
        
        // Chamar callback imediatamente para vídeo e imagem única
        onFilesSelected([file]);
      }
    },
    [postType, config, selectedFiles, previewUrls, onFilesSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: config.maxSize,
    multiple: config.multiple,
    accept: config.accept,
  });

  const handleRemoveImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
    
    // Revogar URL do preview removido
    URL.revokeObjectURL(previewUrls[index]);
  };

  const handleConfirmCarousel = () => {
    if (selectedFiles.length < MIN_CAROUSEL_IMAGES) {
      alert(`Adicione pelo menos ${MIN_CAROUSEL_IMAGES} imagens`);
      return;
    }
    onFilesSelected(selectedFiles);
  };

  const statusLabel = (() => {
    if (status === "uploading") return "⏳ Fazendo upload...";
    if (status === "processing") return "⚙️ Processando...";
    if (status === "ready") return "✅ Upload concluído";
    if (status === "error") return "❌ Erro no upload";
    return null;
  })();

  // Limpar previews ao desmontar
  React.useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition cursor-pointer ${
          isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white"
        }`}
        style={{ minHeight: window.innerWidth < 768 ? 160 : 220 }}
      >
        <input {...getInputProps()} />
        <div className="text-4xl">{config.icon}</div>
        <div className="mt-4 text-lg font-medium">{config.title}</div>
        <div className="mt-2 text-sm text-slate-500">{config.subtitle}</div>
      </div>


      {/* Preview de imagens (carrossel ou imagem única) */}
      {postType !== 'video' && previewUrls.length > 0 && status === 'idle' && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">
              {postType === 'carousel' 
                ? `${selectedFiles.length} ${selectedFiles.length === 1 ? 'imagem selecionada' : 'imagens selecionadas'}`
                : 'Preview da imagem'
              }
            </div>
            {postType === 'carousel' && (
              <div className="text-xs text-slate-500">
                {selectedFiles.length < MIN_CAROUSEL_IMAGES && (
                  <span className="text-orange-600">
                    Adicione pelo menos {MIN_CAROUSEL_IMAGES - selectedFiles.length} imagem(ns)
                  </span>
                )}
                {selectedFiles.length >= MIN_CAROUSEL_IMAGES && (
                  <span className="text-green-600">✓ Pronto para continuar</span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
                {postType === 'carousel' && (
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    ×
                  </button>
                )}
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          {postType === 'carousel' && (
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedFiles([]);
                  setPreviewUrls([]);
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Limpar todas
              </button>
              <button
                onClick={handleConfirmCarousel}
                disabled={selectedFiles.length < MIN_CAROUSEL_IMAGES}
                className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar com {selectedFiles.length} imagens →
              </button>
            </div>
          )}

          {postType === 'image' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setSelectedFiles([]);
                  setPreviewUrls([]);
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Escolher outra imagem
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status de upload */}
      {(status === "uploading" || status === "processing") && (
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-slate-600">{statusLabel}</div>
          <div className="mt-2">
            <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
              <div
                className="h-2 bg-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-slate-500">{progress}%</div>
          </div>
          {onCancel && (
            <div className="mt-3">
              <button
                onClick={onCancel}
                className="px-3 py-1 rounded bg-red-100 text-red-700 text-sm"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status de sucesso */}
      {status === "ready" && (
        <div className="bg-green-50 p-4 rounded text-sm text-green-800">
          {statusLabel}
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
      )}
    </div>
  );
};

export default MediaUpload;
