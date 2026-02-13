import React from "react";
import { USER_PROFILES, UserProfile } from "../../constants/profiles";
import { cn } from "../../lib/utils";

type Props = {
  value?: string[];
  onChange: (next: string[]) => void;
  showAll?: boolean;
};

const ColorMap: Record<string, string> = {
  purple: "bg-purple-100 text-purple-700",
  blue: "bg-blue-100 text-blue-700",
  indigo: "bg-indigo-100 text-indigo-700",
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
  pink: "bg-pink-100 text-pink-700",
  yellow: "bg-yellow-100 text-yellow-700",
  cyan: "bg-cyan-100 text-cyan-700",
  gray: "bg-gray-100 text-gray-700",
};

const ProfileCard: React.FC<{
  profile: UserProfile;
  selected: boolean;
  onToggle: (id: string) => void;
}> = ({ profile, selected, onToggle }) => {
  return (
    <button
      type="button"
      onClick={() => onToggle(profile.id)}
      className={cn(
        "p-3 rounded-lg border text-left transition flex flex-col",
        selected ? "bg-indigo-50 border-indigo-300" : "bg-white border-slate-200 hover:border-indigo-200",
      )}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("text-2xl", ColorMap[profile.color] ?? "bg-gray-100")}>{profile.icon}</div>
          <div>
            <div className="font-medium">{profile.name}</div>
            <div className="text-xs text-slate-500 mt-1">{profile.description}</div>
          </div>
        </div>
        <div className="text-xs text-slate-400">{selected ? "✓ Selecionado" : ""}</div>
      </div>

      <div className="text-xs text-slate-400 mt-3">Ex: {profile.examples.slice(0, 3).join(", ")}</div>
    </button>
  );
};

const ProfileSelector: React.FC<Props> = ({ value = [], onChange, showAll = false }) => {
  const [expanded, setExpanded] = React.useState<boolean>(showAll);
  const visible = expanded ? USER_PROFILES : USER_PROFILES.slice(0, 5);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {visible.map((p) => (
          <ProfileCard key={p.id} profile={p} selected={value.includes(p.id)} onToggle={toggle} />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded((s) => !s)} className="text-sm text-indigo-600">
          {expanded ? "Ver menos" : `Ver todos os ${USER_PROFILES.length} perfis`}
        </button>
        <div className="text-sm text-slate-500">{value.length} perfil{value.length !== 1 ? "s" : ""} selecionado{value.length !== 1 ? "s" : ""}</div>
      </div>
    </div>
  );
};

export default ProfileSelector;