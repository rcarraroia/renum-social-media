import React from "react";
import SubtitleStylePicker, { SubtitleStyle } from "./SubtitleStylePicker";

type Silence = { start: number; end: number; duration: number };

type Props = {
  videoUrl: string;
  videoId?: string;
  scriptText?: string | null;
  onProcessingComplete?: (processedVideoUrl: string) => void;
};

const VideoEditor: React.FC<Props> = ({ videoUrl, videoId, scriptText = "", onProcessingComplete }) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  // Player state
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [playbackRate, setPlaybackRate] = React.useState(1);

  // Timeline & edits
  const [trimStart, setTrimStart] = React.useState(0);
  const [trimEnd, setTrimEnd] = React.useState(0);
  const [silences, setSilences] = React.useState<Silence[]>([]);
  const [removeSilences, setRemoveSilences] = React.useState(false);
  const [silenceSensitivity, setSilenceSensitivity] = React.useState(1); // seconds

  // Subtitles
  const [subEnabled, setSubEnabled] = React.useState(false);
  const [transcribing, setTranscribing] = React.useState(false);
  const [transcription, setTranscription] = React.useState<string>(scriptText ?? "");
  const [subtitleStyle, setSubtitleStyle] = React.useState<SubtitleStyle | null>(null);

  // Processing
  const [processing, setProcessing] = React.useState(false);

  // UI tabs
  const [activeTab, setActiveTab] = React.useState<"subtitles" | "cuts" | "adjusts">("subtitles");

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => {
      setDuration(v.duration || 0);
      setTrimEnd(v.duration || 0);
    };
    const onTime = () => setCurrentTime(v.currentTime || 0);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const seek = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    setCurrentTime(t);
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
  };

  const handleRate = (r: number) => {
    setPlaybackRate(r);
    if (videoRef.current) videoRef.current.playbackRate = r;
  };

  // Mock transcription
  const transcribe = async () => {
    setTranscribing(true);
    setTimeout(() => {
      const mock = transcription || "Transcrição (mock) do áudio do vídeo. Corrija se necessário.";
      setTranscription(mock);
      setTranscribing(false);
    }, 1200);
  };

  // Mock detect silences
  const detectSilences = async () => {
    setSilences([]);
    setTimeout(() => {
      // create some fake silences
      const s: Silence[] = [
        { start: 4.2, end: 6.1, duration: 1.9 },
        { start: 12.0, end: 13.5, duration: 1.5 },
        { start: 28.0, end: 30.2, duration: 2.2 },
      ];
      setSilences(s);
    }, 900);
  };

  // Apply edits & process video (mock)
  const processVideo = async () => {
    // validation
    if (!removeSilences && trimStart <= 0 && trimEnd >= duration && !subEnabled) {
      if (!confirm("Nenhuma edição aplicada. Deseja continuar com o vídeo original?")) return;
    }

    setProcessing(true);
    // assemble payload
    const payload = {
      videoId,
      edits: {
        trim: { start: trimStart, end: trimEnd },
        removeSilences,
        silenceSensitivity,
      },
      subtitles: {
        enabled: subEnabled,
        transcription,
        style: subtitleStyle,
      },
    };

    console.log("Process payload", payload);

    // Mock network delay
    setTimeout(() => {
      setProcessing(false);
      // For mock we return the same video URL
      const processed = videoUrl;
      onProcessingComplete?.(processed);
    }, 2200);
  };

  // When user changes subtitle style
  const handleStyleChange = (s: SubtitleStyle) => {
    setSubtitleStyle(s);
  };

  // Preview functions
  const playPreviewSegment = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = trimStart;
    v.play();
    setPlaying(true);
    const to = () => {
      if (v.currentTime >= trimEnd) {
        v.pause();
        setPlaying(false);
        v.removeEventListener("timeupdate", to);
      }
    };
    v.addEventListener("timeupdate", to);
  };

  return (
    <div className="space-y-4">
      <div className="bg-black rounded-lg overflow-hidden">
        <div className="relative" style={{ paddingTop: "56.25%" }}>
          <video ref={videoRef} src={videoUrl} className="absolute inset-0 w-full h-full object-contain" controls={false} />
          {subEnabled && subtitleStyle && (
            <div
              aria-hidden
              className="absolute left-1/2 transform -translate-x-1/2 w-[90%] text-center pointer-events-none"
              style={{
                color: subtitleStyle.textColor,
                fontFamily: subtitleStyle.fontFamily,
                fontSize: subtitleStyle.fontSize,
                bottom: subtitleStyle.position === "bottom" ? `${subtitleStyle.marginPercent}%` : undefined,
                top: subtitleStyle.position === "top" ? `${subtitleStyle.marginPercent}%` : undefined,
                background: subtitleStyle.backgroundColor ? hexToRgba(subtitleStyle.backgroundColor, subtitleStyle.backgroundOpacity ?? 0.6) : "transparent",
                padding: "0.25rem 0.5rem",
                borderRadius: 6,
              }}
            >
              {transcription || "Legenda exemplo (preview)"}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white text-black p-3 flex items-center gap-3">
          <button onClick={togglePlay} className="px-3 py-2 rounded bg-gray-100">
            {playing ? "⏸️" : "▶️"}
          </button>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-slate-600 flex justify-between">
              <div>{formatTime(currentTime)}</div>
              <div>{formatTime(duration)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select value={playbackRate} onChange={(e) => handleRate(Number(e.target.value))} className="rounded border p-1 text-sm">
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => handleVolume(Number(e.target.value))} className="w-24" />
            <button onClick={() => {
              if (!document.fullscreenElement) {
                const el = document.documentElement;
                if (el.requestFullscreen) el.requestFullscreen();
              } else {
                if (document.exitFullscreen) document.exitFullscreen();
              }
            }} className="px-3 py-1 rounded bg-gray-100">⛶</button>
          </div>
        </div>
      </div>

      {/* Timeline placeholder */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Timeline</div>
          <div className="text-xs text-slate-500">Waveform e silêncios (mock)</div>
        </div>
        <div className="h-20 bg-slate-100 rounded relative flex items-center">
          {/* Trim handles visual */}
          <div className="absolute left-0 right-0 h-full flex items-center">
            <div className="bg-slate-300 h-8 mx-2 flex-1 rounded" />
          </div>

          <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-600" style={{ left: `${(trimStart / (duration || 1)) * 100}%` }} />
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-600" style={{ left: `${(trimEnd / (duration || 1)) * 100}%` }} />
          {/* silence markers */}
          {silences.map((s, i) => (
            <div key={i} className="absolute top-0 bottom-0 bg-red-300 opacity-60" style={{ left: `${(s.start / (duration || 1)) * 100}%`, width: `${((s.duration) / (duration || 1)) * 100}%` }} />
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div>
            <label className="text-xs text-slate-500 block">Início</label>
            <input type="number" min={0} max={duration} step={0.1} value={trimStart} onChange={(e) => setTrimStart(Number(e.target.value))} className="rounded border p-1 w-28" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block">Fim</label>
            <input type="number" min={0} max={duration} step={0.1} value={trimEnd} onChange={(e) => setTrimEnd(Number(e.target.value))} className="rounded border p-1 w-28" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                setTrimStart(0);
                setTrimEnd(duration);
              }}
              className="px-3 py-1 rounded bg-gray-100"
            >
              Reset
            </button>
            <button onClick={playPreviewSegment} className="px-3 py-1 rounded bg-indigo-600 text-white">Preview do Corte</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          {/* Nothing here; main content is above */}
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setActiveTab("subtitles")} className={`px-3 py-1 rounded text-sm ${activeTab === "subtitles" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>Legendas</button>
              <button onClick={() => setActiveTab("cuts")} className={`px-3 py-1 rounded text-sm ${activeTab === "cuts" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>Cortes</button>
              <button onClick={() => setActiveTab("adjusts")} className={`px-3 py-1 rounded text-sm ${activeTab === "adjusts" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>Ajustes</button>
            </div>

            {activeTab === "subtitles" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Legendas</div>
                  <div>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={subEnabled} onChange={(e) => setSubEnabled(e.target.checked)} />
                      <span className="text-sm">Ativar</span>
                    </label>
                  </div>
                </div>

                <div>
                  {!subEnabled && <div className="text-xs text-slate-500">Ative as legendas para solicitar transcrição.</div>}

                  {subEnabled && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button onClick={transcribe} className="px-3 py-1 rounded bg-gray-100">{transcribing ? "Transcrevendo..." : "Transcrever"}</button>
                        <button onClick={() => setTranscription("")} className="px-3 py-1 rounded bg-gray-100">Limpar</button>
                      </div>

                      <textarea value={transcription} onChange={(e) => setTranscription(e.target.value)} rows={6} className="w-full rounded border p-2" />

                      <div className="mt-2">
                        <div className="text-sm font-medium mb-2">Estilo das legendas</div>
                        <SubtitleStylePicker videoFrameUrl={videoUrl} selectedStyle={subtitleStyle ?? undefined} onStyleChange={(s) => handleStyleChange(s)} previewText="Exemplo de legenda do seu vídeo" />
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button onClick={() => alert("Preview aplicado (mock)")} className="px-3 py-1 rounded bg-indigo-600 text-white">Aplicar Preview</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "cuts" && (
              <div>
                <div className="font-medium mb-2">Cortes & Remoção de Silêncios</div>
                <div className="mb-2">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={removeSilences} onChange={(e) => setRemoveSilences(e.target.checked)} />
                    <span className="text-sm">Remover silêncios automaticamente</span>
                  </label>
                </div>

                <div className="mb-2">
                  <div className="text-xs text-slate-500">Sensibilidade (s): {silenceSensitivity}s</div>
                  <input type="range" min={0.5} max={3} step={0.5} value={silenceSensitivity} onChange={(e) => setSilenceSensitivity(Number(e.target.value))} className="w-full" />
                </div>

                <div className="flex gap-2">
                  <button onClick={detectSilences} className="px-3 py-1 rounded bg-gray-100">Detectar Silêncios</button>
                  <button onClick={() => setSilences([])} className="px-3 py-1 rounded bg-gray-100">Limpar</button>
                </div>

                <div className="mt-3">
                  <div className="text-sm font-medium mb-2">Silêncios detectados</div>
                  <div className="space-y-2 max-h-32 overflow-auto">
                    {silences.length === 0 && <div className="text-xs text-slate-500">Nenhum silêncio detectado.</div>}
                    {silences.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded">
                        <div className="text-sm"> {formatTime(s.start)} → {formatTime(s.end)}</div>
                        <div className="text-xs text-slate-500">{s.duration.toFixed(1)}s</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "adjusts" && (
              <div>
                <div className="font-medium mb-2">Ajustes (Em breve)</div>
                <div className="text-xs text-slate-500">Brilho, contraste, filtros e marca d'água serão adicionados futuramente.</div>
                <div className="mt-3 space-y-2">
                  <div className="p-3 border rounded bg-slate-50 text-center">Brilho • Em breve</div>
                  <div className="p-3 border rounded bg-slate-50 text-center">Filtros • Em breve</div>
                  <div className="p-3 border rounded bg-slate-50 text-center">Marca d'água • Em breve</div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex flex-col gap-2">
              <button onClick={() => window.history.back()} className="px-3 py-2 rounded bg-gray-100">Voltar</button>
              <button onClick={() => processVideo()} className={`px-3 py-2 rounded ${processing ? "bg-gray-200" : "bg-indigo-600 text-white"}`} disabled={processing}>
                {processing ? "Processando vídeo..." : "Processar Vídeo →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatTime(s: number) {
  if (!s || Number.isNaN(s)) return "00:00";
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function hexToRgba(hex: string, opacity = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default VideoEditor;