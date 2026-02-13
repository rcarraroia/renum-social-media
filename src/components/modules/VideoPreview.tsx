import React from "react";

type Props = {
  processedUrl?: string | null;
  duration?: string;
  size?: string;
  onNewUpload?: () => void;
  onNext?: () => void;
};

const VideoPreview: React.FC<Props> = ({ processedUrl, duration, size, onNewUpload, onNext }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        {processedUrl ? (
          <video className="w-full rounded" src={processedUrl} controls />
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400">Preview indisponível</div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
        <div>
          <div className="text-sm text-slate-500">Informações do vídeo</div>
          <div className="text-sm mt-1">Duração: {duration ?? "—"}</div>
          <div className="text-sm mt-1">Tamanho: {size ?? "—"}</div>
          <div className="text-sm mt-1">Legendas: ✅ Adicionadas automaticamente</div>
        </div>
        <div className="space-x-2">
          <button onClick={onNewUpload} className="px-3 py-1 rounded bg-gray-100">← Fazer Novo Upload</button>
          <button onClick={onNext} className="px-3 py-1 rounded bg-indigo-600 text-white">Próximo: Editar Descrições →</button>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;