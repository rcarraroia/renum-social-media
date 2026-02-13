import React from "react";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: string;
  loading?: boolean;
  icon?: React.ReactNode;
};

const StatCard: React.FC<Props> = ({ title, value, subtitle, accent = "bg-indigo-50 text-indigo-700", loading = false, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${accent} flex items-center justify-center`}>{icon}</div>
      <div className="flex-1">
        <div className="text-sm text-slate-500">{title}</div>
        <div className="text-2xl font-semibold mt-1">{loading ? "—" : value}</div>
        {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
      </div>
    </div>
  );
};

export default StatCard;