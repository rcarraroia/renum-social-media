import React from "react";
import { useNavigate } from "react-router-dom";

type BestTime = {
  day: string;
  timeRange: string;
  engagement: number;
  rank: number;
};

const BestTimes: React.FC<{ items: BestTime[]; loading?: boolean }> = ({ items = [], loading = false }) => {
  const navigate = useNavigate();

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-4 animate-pulse h-60" />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <div className="text-sm text-slate-600 mb-2">⏰ Melhores horários para postar</div>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.rank} className="p-3 border rounded flex items-center justify-between">
            <div>
              <div className="font-medium">{`${it.rank}. ${it.day}`}</div>
              <div className="text-sm text-slate-500">{it.timeRange} • {it.engagement}% engagement médio</div>
            </div>
            <div>
              <button onClick={() => navigate("/calendar")} className="px-3 py-1 rounded bg-indigo-600 text-white">Agendar neste horário</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BestTimes;