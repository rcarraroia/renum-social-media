import React from "react";

type PresetKey =
  | "classic"
  | "bold-highlight"
  | "word-by-word"
  | "karaoke"
  | "minimal"
  | "color-box";

export type SubtitleStyle = {
  preset: PresetKey;
  textColor: string;
  highlightColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  fontFamily: string;
  fontSize: number;
  position: "top" | "center" | "bottom";
  marginPercent: number; // 0-30
};

type Props = {
  videoFrameUrl?: string;
  selectedStyle?: SubtitleStyle;
  onStyleChange?: (s: SubtitleStyle) => void;
  previewText?: string;
};

const DEFAULT_STYLE: SubtitleStyle = {
  preset: "classic",
  textColor: "#FFFFFF",
  highlightColor: "#FFD700",
  backgroundColor: "#000000",
  backgroundOpacity: 0.6,
  fontFamily: "Montserrat",
  fontSize: 24,
  position: "bottom",
  marginPercent: 5,
};

const FONT_OPTIONS = ["Arial", "Impact", "Montserrat", "Roboto", "Comic Sans MS", "Poppins"];

const PRESETS: { key: PresetKey; name: string; description?: string }[] = [
  { key: "classic", name: "Clássico" },
  { key: "bold-highlight", name: "Negrito Destaque" },
  { key: "word-by-word", name: "Palavra-a-Palavra" },
  { key: "karaoke", name: "Karaokê" },
  { key: "minimal", name: "Minimal" },
  { key: "color-box", name: "Caixa Colorida" },
];

function hexToRgba(hex: string, opacity = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const SmallColorButton: React.FC<{ color: string; onClick: () => void; selected?: boolean }> = ({ color, onClick, selected }) => (
  <button
    onClick={onClick}
    aria-label={color}
    className={`w-8 h-8 rounded ${selected ? "ring-2 ring-offset-1 ring-indigo-500" : "border"} `}
    style={{ background: color }}
  />
);

const SubtitleStylePicker: React.FC<Props> = ({ videoFrameUrl, selectedStyle, onStyleChange, previewText = "Exemplo de legenda do seu vídeo" }) => {
  const [style, setStyle] = React.useState<SubtitleStyle>(selectedStyle ?? DEFAULT_STYLE);

  React.useEffect(() => {
    if (selectedStyle) setStyle(selectedStyle);
  }, [selectedStyle]);

  const emitChange = (next: Partial<SubtitleStyle>) => {
    const s = { ...style, ...next };
    setStyle(s);
    onStyleChange?.(s);
  };

  const quickColors = ["#FFFFFF", "#000000", "#FFD700", "#FF4D4F", "#2563EB", "#10B981"];

  const fontSizeLabel = (v: number) => {
    if (v <= 18) return "Pequeno";
    if (v <= 24) return "Médio";
    if (v <= 32) return "Grande";
    return "Extra Grande";
  };

  const presetCard = (p: typeof PRESETS[number]) => {
    const active = style.preset === p.key;
    return (
      <button
        key={p.key}
        onClick={() => emitChange({ preset: p.key })}
        className={`p-3 rounded-lg border text-left transition ${active ? "border-indigo-500 bg-indigo-50" : "bg-white hover:border-indigo-200"}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-slate-500 mt-1">{p.description}</div>
          </div>
          <div className="w-16 h-12 bg-slate-100 rounded flex items-center justify-center text-sm text-slate-500">Preview</div>
        </div>
      </button>
    );
  };

  const previewOverlayStyle: React.CSSProperties = {
    color: style.textColor,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    textAlign: "center",
    padding: "0.25rem 0.5rem",
    lineHeight: 1.2,
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    width: "90%",
    maxWidth: "calc(100% - 2rem)",
    borderRadius: 6,
  };

  const background = style.backgroundColor ? hexToRgba(style.backgroundColor, style.backgroundOpacity ?? 0.6) : "transparent";
  const positionStyle =
    style.position === "top"
      ? { top: `${style.marginPercent}%` }
      : style.position === "center"
      ? { top: "50%", transform: "translate(-50%, -50%)" }
      : { bottom: `${style.marginPercent}%` };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-black rounded overflow-hidden relative" style={{ paddingTop: "56.25%" }}>
            {/* video frame */}
            {videoFrameUrl ? (
              <img src={videoFrameUrl} alt="preview frame" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">Frame do vídeo</div>
            )}

            {/* preview text overlay */}
            <div style={{ ...previewOverlayStyle, background, ...positionStyle }} className="pointer-events-none">
              {/* simple presets behavior for word-by-word and karaoke represented visually */}
              {style.preset === "word-by-word" ? (
                <span>
                  <span style={{ color: style.highlightColor ?? "#FFD700" }}>Exemplo</span> de legenda do seu vídeo
                </span>
              ) : style.preset === "karaoke" ? (
                <span>
                  <span style={{ background: style.highlightColor ?? "#FFD700", color: "#000", padding: "0 6px", borderRadius: 4 }}>Exemplo</span> de legenda do seu vídeo
                </span>
              ) : style.preset === "color-box" ? (
                <div style={{ background: style.backgroundColor ?? "#ff4d4f", padding: "6px 8px", borderRadius: 6, color: style.textColor }}>{previewText}</div>
              ) : (
                <div>{previewText}</div>
              )}
            </div>
          </div>

          {/* preview caption */}
          <div className="mt-2 text-xs text-slate-500">Preview ao vivo — as alterações são aplicadas em tempo real.</div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="text-sm font-medium">Estilos Rápidos</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESETS.map((p) => presetCard(p))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 mt-4 space-y-3">
            <div className="text-sm font-medium">Ações</div>
            <div className="flex gap-2">
              <button onClick={() => emitChange(DEFAULT_STYLE)} className="px-3 py-2 rounded bg-gray-100">Resetar</button>
              <button onClick={() => onStyleChange?.(style)} className="px-3 py-2 rounded bg-indigo-600 text-white">Aplicar</button>
            </div>
          </div>
        </div>
      </div>

      {/* Customization area */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium">Cor do Texto</div>
            <div className="mt-2 flex items-center gap-2">
              {quickColors.map((c) => (
                <SmallColorButton key={c} color={c} onClick={() => emitChange({ textColor: c })} selected={style.textColor === c} />
              ))}
              <input type="color" value={style.textColor} onChange={(e) => emitChange({ textColor: e.target.value })} className="ml-2 w-10 h-8 p-0 border rounded" />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Cor do Destaque</div>
            <div className="mt-2 flex items-center gap-2">
              {quickColors.map((c) => (
                <SmallColorButton key={c} color={c} onClick={() => emitChange({ highlightColor: c })} selected={style.highlightColor === c} />
              ))}
              <input type="color" value={style.highlightColor ?? "#FFD700"} onChange={(e) => emitChange({ highlightColor: e.target.value })} className="ml-2 w-10 h-8 p-0 border rounded" />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Cor de Fundo</div>
            <div className="mt-2 flex items-center gap-2">
              {quickColors.map((c) => (
                <SmallColorButton key={c} color={c} onClick={() => emitChange({ backgroundColor: c })} selected={style.backgroundColor === c} />
              ))}
              <input type="color" value={style.backgroundColor ?? "#000000"} onChange={(e) => emitChange({ backgroundColor: e.target.value })} className="ml-2 w-10 h-8 p-0 border rounded" />
            </div>

            <div className="mt-3">
              <div className="text-sm">Opacidade do Fundo: {(style.backgroundOpacity ?? 0.6) * 100}%</div>
              <input type="range" min={0} max={1} step={0.05} value={style.backgroundOpacity ?? 0.6} onChange={(e) => emitChange({ backgroundOpacity: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Fonte</div>
            <select value={style.fontFamily} onChange={(e) => emitChange({ fontFamily: e.target.value })} className="mt-2 w-full rounded border p-2">
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <div className="mt-3">
              <div className="text-sm">Tamanho: {fontSizeLabel(style.fontSize)} ({style.fontSize}px)</div>
              <input
                type="range"
                min={16}
                max={48}
                step={2}
                value={style.fontSize}
                onChange={(e) => emitChange({ fontSize: Number(e.target.value) })}
                className="w-full mt-2"
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Posição</div>
            <div className="mt-2 flex gap-2 items-center">
              <button onClick={() => emitChange({ position: "top" })} className={`px-3 py-2 rounded ${style.position === "top" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>Superior</button>
              <button onClick={() => emitChange({ position: "center" })} className={`px-3 py-2 rounded ${style.position === "center" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>Central</button>
              <button onClick={() => emitChange({ position: "bottom" })} className={`px-3 py-2 rounded ${style.position === "bottom" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>Inferior</button>
            </div>

            <div className="mt-3">
              <div className="text-sm">Margem (% altura): {style.marginPercent}%</div>
              <input type="range" min={0} max={30} step={1} value={style.marginPercent} onChange={(e) => emitChange({ marginPercent: Number(e.target.value) })} className="w-full mt-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubtitleStylePicker;