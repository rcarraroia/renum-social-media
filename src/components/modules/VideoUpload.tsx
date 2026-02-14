import React from "react";
import { useDropzone } from "react-dropzone";

type Props = {
  onFileSelected: (file: File) => void;
  status?: "idle" | "uploading" | "processing" | "ready" | "error";
  progress: number;
  onCancel?: () => void;
  error?: string | null;
};

const MAX_BYTES = 100 * 1024 * 1024; // 100MB

const VideoUpload: React.FC<Props> = ({ onFileSelected, status = "idle", progress, onCancel, error }) => {
  const onDrop = React.useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      if (fileRejections?.length) {
        const rej = fileRejections[0];
        if (rej?.file?.size > MAX_BYTES) {
          return alert("Arquivo muito grande. Máximo: 100MB");
        }
        return alert("Formato não suportado. Use MP4, MOV ou AVI");
      }
      const file = acceptedFiles[0];
      if (!file) return;
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_BYTES,
    multiple: false,
    accept: {
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
      "video/x-msvideo": [".avi"],
    },
  });

  const statusLabel = (() => {
    if (status === "uploading") return "⏳ Fazendo upload do vídeo...";
    if (status === "processing") return "⚙️ Processando vídeo...";
    if (status === "ready") return "✅ Upload concluído";
    if (status === "error") return "❌ Erro no upload";
    return null;
  })();

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition ${isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white"}`}
        style={{ minHeight: window.innerWidth < 768 ? 160 : 220 }}
      >
        <input {...getInputProps()} />
        <div className="text-4xl">📹</div>
        <div className="mt-4 text-lg font-medium">Arraste seu vídeo aqui ou clique para selecionar</div>
        <div className="mt-2 text-sm text-slate-500">Formatos: MP4, MOV, AVI • Máx: 100MB</div>
      </div>

      {(status === "uploading" || status === "processing") && (
        <div className="mt-4 bg-white p-4 rounded shadow">
          <div className="text-sm text-slate-600">{statusLabel}</div>
          <div className="mt-2">
            <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
              <div className="h-2 bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 text-sm text-slate-500">{progress}%</div>
          </div>
          <div className="mt-3">
            <button onClick={onCancel} className="px-3 py-1 rounded bg-red-100 text-red-700 text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {status === "ready" && (
        <div className="mt-4 bg-green-50 p-4 rounded text-sm text-green-800">
          {statusLabel}
        </div>
      )}

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
      )}
    </div>
  );
};

export default VideoUpload;