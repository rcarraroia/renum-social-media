import React, { useState, useEffect } from "react";
import { PostType, AspectRatio, Platform, getCompatiblePlatforms, getAvailablePlatforms } from "@/lib/compatibility";
import PlatformSelector from "./PlatformSelector";
import { api } from "@/lib/api";

interface PostConfig {
  postType: PostType;
  aspectRatio?: AspectRatio;
  selectedPlatforms: Platform[];
  platformTypes: Record<string, string>;
}

interface PostConfigStepProps {
  onComplete: (config: PostConfig) => void;
  onBack?: () => void;
}

type SubStep = 'type' | 'aspect-ratio' | 'platforms';

const PostConfigStep: React.FC<PostConfigStepProps> = ({ onComplete, onBack }) => {
  const [subStep, setSubStep] = useState<SubStep>('type');
  const [postType, setPostType] = useState<PostType | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar plataformas conectadas
  useEffect(() => {
    async function loadConnectedPlatforms() {
      try {
        const response = await api.social.listAccounts();
        const connected = response.accounts
          .filter(acc => acc.connected)
          .map(acc => acc.platform as Platform);
        setConnectedPlatforms(connected);
      } catch (error) {
        console.error('Erro ao carregar plataformas:', error);
        setConnectedPlatforms([]);
      } finally {
        setLoading(false);
      }
    }
    loadConnectedPlatforms();
  }, []);

  const handleTypeSelect = (type: PostType) => {
    setPostType(type);
    if (type === 'video') {
      setSubStep('aspect-ratio');
    } else {
      // Imagem e carrossel não precisam de proporção
      setAspectRatio(null);
      setSubStep('platforms');
    }
  };

  const handleAspectRatioSelect = (ratio: AspectRatio) => {
    setAspectRatio(ratio);
    setSubStep('platforms');
  };

  const handleComplete = () => {
    if (!postType) return;
    if (selectedPlatforms.length === 0) {
      alert('Selecione pelo menos uma rede social');
      return;
    }

    const compatibleConfig = getCompatiblePlatforms(postType, aspectRatio || undefined);
    const platformTypes: Record<string, string> = {};
    
    selectedPlatforms.forEach(platform => {
      platformTypes[platform] = compatibleConfig.types[platform] || '';
    });

    onComplete({
      postType,
      aspectRatio: aspectRatio || undefined,
      selectedPlatforms,
      platformTypes
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className={`flex-1 h-1 rounded ${subStep === 'type' || subStep === 'aspect-ratio' || subStep === 'platforms' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
        <div className={`flex-1 h-1 rounded ${subStep === 'aspect-ratio' || subStep === 'platforms' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
        <div className={`flex-1 h-1 rounded ${subStep === 'platforms' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
      </div>

      {/* Sub-step 1: Tipo de Post */}
      {subStep === 'type' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Que tipo de conteúdo você quer publicar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleTypeSelect('video')}
              className="p-6 border-2 border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-center"
            >
              <div className="text-4xl mb-3">📹</div>
              <div className="font-semibold mb-2">Vídeo</div>
              <div className="text-sm text-slate-600">
                Crie vídeos para redes sociais
              </div>
            </button>

            <button
              onClick={() => handleTypeSelect('image')}
              className="p-6 border-2 border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-center"
            >
              <div className="text-4xl mb-3">🖼️</div>
              <div className="font-semibold mb-2">Imagem</div>
              <div className="text-sm text-slate-600">
                Publique uma imagem única
              </div>
            </button>

            <button
              onClick={() => handleTypeSelect('carousel')}
              className="p-6 border-2 border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-center"
            >
              <div className="text-4xl mb-3">🎞️</div>
              <div className="font-semibold mb-2">Carrossel</div>
              <div className="text-sm text-slate-600">
                Até 10 imagens em sequência
              </div>
            </button>
          </div>

          {onBack && (
            <div className="mt-6">
              <button onClick={onBack} className="px-4 py-2 rounded bg-gray-100">
                ← Voltar
              </button>
            </div>
          )}
        </div>
      )}


      {/* Sub-step 2: Proporção (apenas para vídeo) */}
      {subStep === 'aspect-ratio' && postType === 'video' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Escolha a proporção do vídeo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleAspectRatioSelect('9:16')}
              className="p-6 border-2 border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              <div className="text-4xl mb-3">📱</div>
              <div className="font-semibold mb-2">9:16 Vertical</div>
              <div className="text-sm text-slate-600 mb-3">1080 x 1920</div>
              <div className="text-xs text-slate-500 space-y-1">
                <div>📷 Instagram Reels</div>
                <div>🎵 TikTok</div>
                <div>📘 Facebook Reels</div>
                <div>▶️ YouTube Shorts</div>
              </div>
            </button>

            <button
              onClick={() => handleAspectRatioSelect('1:1')}
              className="p-6 border-2 border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              <div className="text-4xl mb-3">⬜</div>
              <div className="font-semibold mb-2">1:1 Quadrado</div>
              <div className="text-sm text-slate-600 mb-3">1080 x 1080</div>
              <div className="text-xs text-slate-500 space-y-1">
                <div>📷 Instagram Feed</div>
                <div>📘 Facebook Feed</div>
                <div>💼 LinkedIn</div>
                <div>🐦 X/Twitter</div>
              </div>
            </button>

            <button
              onClick={() => handleAspectRatioSelect('16:9')}
              className="p-6 border-2 border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              <div className="text-4xl mb-3">📺</div>
              <div className="font-semibold mb-2">16:9 Horizontal</div>
              <div className="text-sm text-slate-600 mb-3">1920 x 1080</div>
              <div className="text-xs text-slate-500 space-y-1">
                <div>▶️ YouTube</div>
                <div>💼 LinkedIn</div>
                <div>📘 Facebook</div>
                <div>🐦 X/Twitter</div>
              </div>
            </button>
          </div>

          <div className="mt-6">
            <button
              onClick={() => setSubStep('type')}
              className="px-4 py-2 rounded bg-gray-100"
            >
              ← Voltar
            </button>
          </div>
        </div>
      )}

      {/* Sub-step 3: Seleção de Plataformas */}
      {subStep === 'platforms' && postType && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Selecione onde publicar
            {postType === 'video' && aspectRatio && (
              <span className="text-sm font-normal text-slate-500 ml-2">
                (Vídeo {aspectRatio})
              </span>
            )}
            {postType === 'image' && (
              <span className="text-sm font-normal text-slate-500 ml-2">
                (Imagem única)
              </span>
            )}
            {postType === 'carousel' && (
              <span className="text-sm font-normal text-slate-500 ml-2">
                (Carrossel)
              </span>
            )}
          </h2>

          <PlatformSelector
            compatiblePlatforms={getCompatiblePlatforms(postType, aspectRatio || undefined).platforms}
            connectedPlatforms={connectedPlatforms}
            selectedPlatforms={selectedPlatforms}
            onChange={setSelectedPlatforms}
            showIncompatible={false}
          />

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => {
                if (postType === 'video') {
                  setSubStep('aspect-ratio');
                } else {
                  setSubStep('type');
                }
              }}
              className="px-4 py-2 rounded bg-gray-100"
            >
              ← Voltar
            </button>
            <button
              onClick={handleComplete}
              disabled={selectedPlatforms.length === 0}
              className="px-6 py-2 rounded bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar com {selectedPlatforms.length} {selectedPlatforms.length === 1 ? 'rede' : 'redes'} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostConfigStep;
