import React from "react";
import { Platform } from "@/lib/compatibility";

interface PlatformSelectorProps {
  compatiblePlatforms: Platform[];
  connectedPlatforms: Platform[];
  selectedPlatforms: Platform[];
  onChange: (platforms: Platform[]) => void;
  showIncompatible?: boolean;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  x: 'X/Twitter',
  pinterest: 'Pinterest',
  threads: 'Threads',
  bluesky: 'Bluesky'
};

const PLATFORM_ICONS: Record<Platform, string> = {
  instagram: '📷',
  tiktok: '🎵',
  facebook: '📘',
  youtube: '▶️',
  linkedin: '💼',
  x: '🐦',
  pinterest: '📌',
  threads: '🧵',
  bluesky: '🦋'
};

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  compatiblePlatforms,
  connectedPlatforms,
  selectedPlatforms,
  onChange,
  showIncompatible = false
}) => {
  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      onChange(selectedPlatforms.filter(p => p !== platform));
    } else {
      onChange([...selectedPlatforms, platform]);
    }
  };

  const selectAll = () => {
    const available = compatiblePlatforms.filter(p => 
      connectedPlatforms.includes(p)
    );
    onChange(available);
  };

  const deselectAll = () => {
    onChange([]);
  };

  // Plataformas disponíveis (compatíveis E conectadas)
  const availablePlatforms = compatiblePlatforms.filter(p => 
    connectedPlatforms.includes(p)
  );

  // Plataformas compatíveis mas não conectadas
  const missingPlatforms = compatiblePlatforms.filter(p => 
    !connectedPlatforms.includes(p)
  );

  // Plataformas incompatíveis
  const incompatiblePlatforms = (Object.keys(PLATFORM_LABELS) as Platform[]).filter(p => 
    !compatiblePlatforms.includes(p)
  );

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          Selecione onde publicar
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            disabled={availablePlatforms.length === 0}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Selecionar Todas
          </button>
          <button
            onClick={deselectAll}
            disabled={selectedPlatforms.length === 0}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Redes Conectadas e Compatíveis */}
      {availablePlatforms.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-2">Redes Conectadas:</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availablePlatforms.map(platform => (
              <label
                key={platform}
                className={`
                  flex items-center gap-2 p-3 rounded border cursor-pointer transition
                  ${selectedPlatforms.includes(platform)
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platform)}
                  onChange={() => togglePlatform(platform)}
                  className="rounded"
                />
                <span className="text-lg">{PLATFORM_ICONS[platform]}</span>
                <span className="text-sm font-medium">{PLATFORM_LABELS[platform]}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Aviso se nenhuma rede disponível */}
      {availablePlatforms.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <div className="font-medium text-sm">Nenhuma rede conectada suporta este formato</div>
              <div className="text-xs text-slate-600 mt-1">
                Conecte pelo menos uma das redes compatíveis em Configurações
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Redes Compatíveis mas Não Conectadas */}
      {missingPlatforms.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-2">Redes Não Conectadas:</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {missingPlatforms.map(platform => (
              <div
                key={platform}
                className="flex items-center gap-2 p-3 rounded border border-slate-200 bg-slate-50 opacity-60"
              >
                <span className="text-lg">{PLATFORM_ICONS[platform]}</span>
                <span className="text-sm">{PLATFORM_LABELS[platform]}</span>
                <span className="ml-auto text-xs">🔒</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <a href="/settings" className="text-indigo-600 hover:underline">
              Conecte essas redes em Configurações →
            </a>
          </div>
        </div>
      )}

      {/* Redes Incompatíveis (opcional) */}
      {showIncompatible && incompatiblePlatforms.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-2">Não suportam este formato:</div>
          <div className="flex flex-wrap gap-2">
            {incompatiblePlatforms.map(platform => (
              <div
                key={platform}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-xs text-slate-400"
              >
                <span>{PLATFORM_ICONS[platform]}</span>
                <span>{PLATFORM_LABELS[platform]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contador de selecionadas */}
      {selectedPlatforms.length > 0 && (
        <div className="text-xs text-slate-500">
          {selectedPlatforms.length} {selectedPlatforms.length === 1 ? 'rede selecionada' : 'redes selecionadas'}
        </div>
      )}
    </div>
  );
};

export default PlatformSelector;
