import React from "react";

const ProgressBar: React.FC<{ value: number; max?: number }> = ({ value, max = 10 }) => {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
        {value.toFixed(1)}%
      </span>
    </div>
  );
};

const NetworkPerformance: React.FC<{ data: any[]; loading?: boolean }> = ({ data = [], loading = false }) => {
  if (loading) return <div className="bg-white rounded-lg shadow p-4 animate-pulse h-48" />;
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="text-sm text-slate-600 mb-2">📱 Performance por rede</div>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.platform} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="font-medium">{d.platform}</div>
              <div className="text-sm text-slate-500">{d.posts} posts • {d.reach} reach</div>
            </div>
            <ProgressBar value={d.engagement ?? 0} max={10} />
            <div className="text-xs text-slate-500">{`Likes: ${d.likes ?? 0} • Comments: ${d.comments ?? 0}`}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkPerformance;