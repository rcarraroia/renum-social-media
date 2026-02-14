import React from "react";

type Platform = "linkedin" | "x" | "instagram" | "tiktok" | "facebook" | "youtube";

type Props = {
  platform: Platform;
  isConnected: boolean;
  accountName?: string | null;
  connecting?: boolean;
  onConnect: (platform: Platform) => void;
  onDisconnect: (platform: Platform) => void;
};

const ICON_BY_PLATFORM: Record<Platform, React.ReactNode> = {
  linkedin: <span className="text-xl">💼</span>,
  x: <span className="text-xl">🐦</span>,
  instagram: <span className="text-xl">📸</span>,
  tiktok: <span className="text-xl">🎵</span>,
  facebook: <span className="text-xl">📘</span>,
  youtube: <span className="text-xl">▶️</span>,
};

const LABEL_BY_PLATFORM: Record<Platform, string> = {
  linkedin: "LinkedIn",
  x: "X",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
};

const SocialAccountCard: React.FC<Props> = ({
  platform,
  isConnected,
  accountName,
  connecting = false,
  onConnect,
  onDisconnect,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-slate-50 flex items-center justify-center text-2xl">
            {ICON_BY_PLATFORM[platform]}
          </div>
          <div>
            <div className="font-medium">{LABEL_BY_PLATFORM[platform]}</div>
            <div className="text-xs text-slate-500">{isConnected ? (accountName ?? "Conta conectada") : "Não conectada"}</div>
          </div>
        </div>

        <div>
          {isConnected ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">Conectada</span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">Não conectada</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {!isConnected ? (
          <button
            onClick={() => onConnect(platform)}
            disabled={connecting}
            className="flex-1 px-3 py-2 rounded bg-indigo-600 text-white text-sm disabled:opacity-60"
          >
            {connecting ? "Conectando..." : `Conectar ao ${LABEL_BY_PLATFORM[platform]}`}
          </button>
        ) : (
          <>
            <button
              onClick={() => onDisconnect(platform)}
              className="flex-1 px-3 py-2 rounded bg-red-100 text-red-700 text-sm"
            >
              Desconectar
            </button>
            <button
              onClick={() => alert(`Gerenciar ${LABEL_BY_PLATFORM[platform]} — futura ação`)}
              className="px-3 py-2 rounded bg-gray-100 text-sm"
            >
              Gerenciar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SocialAccountCard;