import React, { useState } from "react";
import PlatformSelector from "./PlatformSelector";
import { getCompatiblePlatforms, getDimensions, type AspectRatio, type Platform } from "@/lib/compatibility";

interface VideoConfigStepProps {
  onComplete: (config: {
    aspectRatio: AspectRatio;
    platforms: Platform[];
  }) => void;
  onBack?: () => void;
  initialAspectRatio?: AspectRatio;
  initialPlatforms?: Platform[];
}

const VideoConfigStep: React.FC<VideoConfigStepProps> = ({
  onComplete,
  onBack,
  initialAspectRatio,
  initialPlatforms = []
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio | null>(initialAspectRatio || null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(initialPlatforms);

  const handleContinue = () => {
    if (!aspectRatio) {
      alert("Selecione uma proporção");
      return;
    }

    if (selectedPlatforms.length === 0) {
      alert("Selecione pelo menos uma rede social");
      return;
    }

    onComplete({
      aspectRatio,
      platforms: selectedPlatforms
    });
  };

  const compatibleConfig = aspectRatio 
    ? getCompatiblePlatforms("video", aspectRatio)
    : null;
  
  const compatiblePlatforms = compatibleConfig?.platforms || [];

  const dimensions = aspectRatio ? getDimensions("video", aspectRatio) : null;

  return (
    <div className="space-y-6">
      {/* Seleção de Proporção */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Escolha a proporção do vídeo</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 9:16 - Vertical */}
          <button
            onClick={() => setAspectRatio("9:16")}
            className={`p-6 rounded-lg border-2 transition-all ${
              aspectRatio === "9:16"
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-4xl mb-3">📱</div>
            <div className="font-semibold text-lg">9:16</div>
            <div className="text-sm text-slate-600 mb-3">Vertical</div>
            <div className="text-xs text-slate-500 mb-4">1080 x 1920</div>
            
            <div className="text-left space-y-1">
              <div className="text-xs text-slate-600">📱 Instagram Reels</div>
              <div className="text-xs text-slate-600">🎵 TikTok</div>
              <div className="text-xs text-slate-600">📘 Facebook Reels</div>
              <div className="text-xs text-slate-600">▶️ YouTube Shorts</div>
            </div>
          </button>

          {/* 1:1 - Quadrado */}
          <button
            onClick={() => setAspectRatio("1:1")}
            className={`p-6 rounded-lg border-2 transition-all ${
              aspectRatio === "1:1"
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-4xl mb-3">⬜</div>
            <div className="font-semibold text-lg">1:1</div>
            <div className="text-sm text-slate-600 mb-3">Quadrado</div>
            <div className="text-xs text-slate-500 mb-4">1080 x 1080</div>
            
            <div className="text-left space-y-1">
              <div className="text-xs text-slate-600">📷 Instagram Feed</div>
              <div className="text-xs text-slate-600">📘 Facebook Feed</div>
              <div className="text-xs text-slate-600">💼 LinkedIn</div>
              <div className="text-xs text-slate-600">🐦 X/Twitter</div>
            </div>
          </button>

          {/* 16:9 - Horizontal */}
          <button
            onClick={() => setAspectRatio("16:9")}
            className={`p-6 rounded-lg border-2 transition-all ${
              aspectRatio === "16:9"
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-4xl mb-3">📺</div>
            <div className="font-semibold text-lg">16:9</div>
            <div className="text-sm text-slate-600 mb-3">Horizontal</div>
            <div className="text-xs text-slate-500 mb-4">1920 x 1080</div>
            
            <div className="text-left space-y-1">
              <div className="text-xs text-slate-600">🎬 YouTube</div>
              <div className="text-xs text-slate-600">💼 LinkedIn</div>
              <div className="text-xs text-slate-600">📘 Facebook</div>
              <div className="text-xs text-slate-600">🐦 X/Twitter</div>
            </div>
          </button>
        </div>

        {aspectRatio && dimensions && (
          <div className="mt-4 p-3 bg-indigo-50 rounded text-sm">
            <div className="font-medium text-indigo-900">✓ Proporção selecionada: {aspectRatio}</div>
            <div className="text-indigo-700 mt-1">
              Dimensões: {dimensions.width} x {dimensions.height}px
            </div>
          </div>
        )}
      </div>

      {/* Seleção de Redes */}
      {aspectRatio && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Selecione onde publicar</h3>
          
          <PlatformSelector
            compatiblePlatforms={compatiblePlatforms}
            connectedPlatforms={compatiblePlatforms} // TODO: Buscar redes conectadas via API
            selectedPlatforms={selectedPlatforms}
            onChange={setSelectedPlatforms}
          />

          {selectedPlatforms.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded text-sm">
              <div className="font-medium text-green-900">
                ✓ {selectedPlatforms.length} {selectedPlatforms.length === 1 ? "rede selecionada" : "redes selecionadas"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="flex justify-between">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
            >
              ← Voltar
            </button>
          )}
        </div>
        <div>
          <button
            onClick={handleContinue}
            disabled={!aspectRatio || selectedPlatforms.length === 0}
            className="px-6 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar para Aprovação →
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoConfigStep;
