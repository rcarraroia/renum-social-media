import React from "react";

interface TeleprompterControlsProps {
  isScrolling: boolean;
  scrollSpeed: number;
  fontSize: number;
  textOpacity: number;
  textArea: number;
  textPosition: "top" | "center" | "bottom";
  textColor: "white" | "yellow";
  onToggleScroll: () => void;
  onSpeedChange: (speed: number) => void;
  onFontSizeChange: (size: number) => void;
  onOpacityChange: (opacity: number) => void;
  onTextAreaChange: (area: number) => void;
  onPositionChange: (position: "top" | "center" | "bottom") => void;
  onColorChange: (color: "white" | "yellow") => void;
}

const TeleprompterControls: React.FC<TeleprompterControlsProps> = ({
  isScrolling,
  scrollSpeed,
  fontSize,
  textOpacity,
  textArea,
  textPosition,
  textColor,
  onToggleScroll,
  onSpeedChange,
  onFontSizeChange,
  onOpacityChange,
  onTextAreaChange,
  onPositionChange,
  onColorChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-3 md:p-4 space-y-3 md:space-y-4 touch-manipulation">
      {/* Play/Pause */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-sm md:text-base font-medium">Controles do Teleprompter</h3>
          <p className="text-xs text-slate-500">Ajuste a velocidade e o tamanho da fonte</p>
        </div>
        <button
          onClick={onToggleScroll}
          className={`px-4 py-2 rounded font-medium transition-colors min-h-[44px] ${
            isScrolling
              ? "bg-yellow-500 text-white hover:bg-yellow-600"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {isScrolling ? "⏸ Pausar" : "▶ Iniciar"}
        </button>
      </div>

      {/* Velocidade */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs md:text-sm font-medium">Velocidade</label>
          <span className="text-xs md:text-sm text-slate-600">{scrollSpeed}/10</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSpeedChange(Math.max(1, scrollSpeed - 1))}
            disabled={scrollSpeed <= 1}
            className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
          >
            ◀
          </button>
          <input
            type="range"
            min="1"
            max="10"
            value={scrollSpeed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={() => onSpeedChange(Math.min(10, scrollSpeed + 1))}
            disabled={scrollSpeed >= 10}
            className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
          >
            ▶
          </button>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Lento</span>
          <span>Rápido</span>
        </div>
      </div>

      {/* Tamanho da Fonte */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs md:text-sm font-medium">Tamanho da Fonte</label>
          <span className="text-xs md:text-sm text-slate-600">{fontSize}px</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onFontSizeChange(Math.max(16, fontSize - 2))}
            disabled={fontSize <= 16}
            className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px] min-w-[44px]"
          >
            A-
          </button>
          <input
            type="range"
            min="16"
            max="48"
            step="2"
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={() => onFontSizeChange(Math.min(48, fontSize + 2))}
            disabled={fontSize >= 48}
            className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg min-h-[44px] min-w-[44px]"
          >
            A+
          </button>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Pequeno</span>
          <span>Grande</span>
        </div>
      </div>

      {/* Transparência do Fundo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs md:text-sm font-medium">Transparência do Fundo</label>
          <span className="text-xs md:text-sm text-slate-600">{Math.round(textOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={textOpacity * 100}
          onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          style={{ minHeight: '44px' }}
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>Transparente</span>
          <span>Opaco</span>
        </div>
      </div>

      {/* Área do Texto */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs md:text-sm font-medium">Área do Texto</label>
          <span className="text-xs md:text-sm text-slate-600">{textArea}%</span>
        </div>
        <input
          type="range"
          min="30"
          max="100"
          step="10"
          value={textArea}
          onChange={(e) => onTextAreaChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          style={{ minHeight: '44px' }}
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>30%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Posição do Texto */}
      <div className="space-y-2">
        <label className="text-xs md:text-sm font-medium">Posição do Texto</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onPositionChange("top")}
            className={`px-3 py-2 rounded text-xs md:text-sm font-medium transition-colors min-h-[44px] ${
              textPosition === "top"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Topo
          </button>
          <button
            onClick={() => onPositionChange("center")}
            className={`px-3 py-2 rounded text-xs md:text-sm font-medium transition-colors min-h-[44px] ${
              textPosition === "center"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Centro
          </button>
          <button
            onClick={() => onPositionChange("bottom")}
            className={`px-3 py-2 rounded text-xs md:text-sm font-medium transition-colors min-h-[44px] ${
              textPosition === "bottom"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Baixo
          </button>
        </div>
      </div>

      {/* Cor do Texto */}
      <div className="space-y-2">
        <label className="text-xs md:text-sm font-medium">Cor do Texto</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onColorChange("white")}
            className={`px-3 py-2 rounded text-xs md:text-sm font-medium transition-colors min-h-[44px] ${
              textColor === "white"
                ? "bg-slate-800 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            ⚪ Branco
          </button>
          <button
            onClick={() => onColorChange("yellow")}
            className={`px-3 py-2 rounded text-xs md:text-sm font-medium transition-colors min-h-[44px] ${
              textColor === "yellow"
                ? "bg-yellow-500 text-black"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            🟡 Amarelo
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeleprompterControls;
