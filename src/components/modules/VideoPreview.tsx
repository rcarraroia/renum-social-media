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

      <div className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div>
          <div className="text-sm text-slate-500">Informações do vídeo</div>
          <div className="text-sm mt-1">Duração: {duration ?? "—"}</div>
          <div className="text-sm mt-1">Tamanho: {size ?? "—"}</div>
          <div className="text-sm mt-1">Legendas: ✅ Adicionadas automaticamente</div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={onNewUpload} className="px-3 py-2 rounded bg-gray-100 min-h-[44px]">← Fazer Novo Upload</button>
          <button onClick={onNext} className="px-3 py-2 rounded bg-indigo-600 text-white min-h-[44px]">Próximo: Editar Descrições →</button>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;