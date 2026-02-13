import React from "react";

type Voice = {
  id: string;
  name: string;
  gender: string;
  tone: string;
  speed: string;
  sampleUrl?: string;
  language?: string;
  recommended?: boolean;
};

const MOCK_VOICES: Voice[] = [
  { id: "voice_pt_001", name: "Juliana", gender: "female", tone: "natural", speed: "medium", sampleUrl: "" },
  { id: "voice_pt_002", name: "Fernanda", gender: "female", tone: "professional", speed: "medium_fast", sampleUrl: "" },
];

type Props = {
  selected?: Voice | null;
  onSelect: (v: Voice) => void;
};

const VoiceSelector: React.FC<Props> = ({ selected, onSelect }) => {
  const playSample = (v: Voice) => {
    // For now we don't have real sample URLs; show a small alert or simply no-op
    if (!v.sampleUrl) {
      // eslint-disable-next-line no-alert
      alert(`${v.name} — sample not available in mock`);
      return;
    }
    const audio = new Audio(v.sampleUrl);
    audio.play();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-slate-600 mb-3">🎤 Escolha a voz (PT-BR)</div>
      <div className="space-y-3">
        {MOCK_VOICES.map((v) => {
          const active = selected?.id === v.id;
          return (
            <div key={v.id} className={`p-3 rounded border ${active ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white"} flex items-center justify-between`}>
              <div>
                <div className="font-medium">{v.name} {v.recommended ? <span className="ml-2 text-xs bg-yellow-100 px-2 py-0.5 rounded">Recomendada</span> : null}</div>
                <div className="text-xs text-slate-500">{v.tone} • {v.speed}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => playSample(v)} className="px-3 py-1 rounded bg-gray-100 text-sm">▶ Ouvir</button>
                <button onClick={() => onSelect(v)} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">Selecionar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VoiceSelector;