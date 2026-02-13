import React from "react";
import type { Avatar } from "@/hooks/useAvatar";

const MOCK_AVATARS: Avatar[] = [
  {
    id: "avatar_001",
    name: "Maria Silva",
    gender: "female",
    style: "professional",
    age: "adult",
    thumbnailUrl: "https://via.placeholder.com/160x160.png?text=Maria",
    previewVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    language: "pt-BR",
    recommended: true,
  },
  {
    id: "avatar_002",
    name: "João Santos",
    gender: "male",
    style: "casual",
    age: "young",
    thumbnailUrl: "https://via.placeholder.com/160x160.png?text=João",
    previewVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    language: "pt-BR",
    recommended: false,
  },
];

type Props = {
  selected?: Avatar | null;
  onSelect: (a: Avatar) => void;
};

const AvatarGallery: React.FC<Props> = ({ selected, onSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-slate-600 mb-3">🎭 Selecione o avatar</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MOCK_AVATARS.map((a) => {
          const active = selected?.id === a.id;
          return (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              className={`flex flex-col items-center p-3 rounded-lg border ${active ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white"} text-left`}
            >
              <img src={a.thumbnailUrl} alt={a.name} className="w-24 h-24 object-cover rounded-full" />
              <div className="mt-2 text-sm font-medium">{a.name}</div>
              <div className="text-xs text-slate-500">{a.style} • {a.language}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AvatarGallery;