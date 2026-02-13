import React from "react";
import { cn } from "../../lib/utils";

type Props = {
  platform: "instagram" | "tiktok" | "facebook" | "youtube" | "linkedin" | "x" | string;
  size?: "sm" | "md" | "lg";
};

const COLORS: Record<string, string> = {
  instagram: "bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 text-white",
  tiktok: "bg-black text-white",
  facebook: "bg-blue-600 text-white",
  youtube: "bg-red-600 text-white",
  linkedin: "bg-sky-700 text-white",
  x: "bg-gray-800 text-white",
};

const PlatformBadge: React.FC<Props> = ({ platform, size = "sm" }) => {
  const classes = cn(
    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
    COLORS[platform] ?? "bg-gray-200 text-slate-700",
    size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base",
  );

  const label =
    platform === "instagram"
      ? "IG"
      : platform === "tiktok"
      ? "TT"
      : platform === "facebook"
      ? "FB"
      : platform === "youtube"
      ? "YT"
      : platform === "linkedin"
      ? "LI"
      : platform === "x"
      ? "X"
      : platform.toUpperCase();

  return <span className={classes}>{label}</span>;
};

export default PlatformBadge;