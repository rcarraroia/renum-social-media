import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon?: React.ReactNode;
  label: string;
  value: number | string;
  growth?: number;
  format?: "number" | "percentage" | "compact";
  loading?: boolean;
};

function formatNumber(value: number, formatType?: string) {
  if (formatType === "compact") {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return `${value}`;
  }
  if (formatType === "percentage") {
    return `${(value * 100).toFixed(1)}%`;
  }
  return new Intl.NumberFormat("pt-BR").format(value);
}

const MetricCard: React.FC<Props> = ({ icon, label, value, growth = 0, format = "number", loading = false }) => {
  const growthColor = growth > 0 ? "text-green-600" : growth < 0 ? "text-red-600" : "text-gray-400";
  const growthIcon = growth > 0 ? "▲" : growth < 0 ? "▼" : "─";

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 h-28 animate-pulse" />
    );
  }

  const displayed = typeof value === "number" ? formatNumber(value, format) : value;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{icon}</div>
          <div>
            <div className="text-sm text-slate-500">{label}</div>
            <div className="text-xl font-semibold mt-1">{displayed}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-sm font-medium", growthColor)}>{growthIcon} {Math.abs(Number((growth * 100).toFixed(1)))}%</div>
          <div className="text-xs text-slate-400">vs anterior</div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;