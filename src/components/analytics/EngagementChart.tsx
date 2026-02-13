import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data: Array<{ date: string; engagement: number; reach?: number }>;
  height?: number;
  showReach?: boolean;
  loading?: boolean;
};

const EngagementChart: React.FC<Props> = ({ data = [], height = 320, showReach = false, loading = false }) => {
  if (loading) {
    return <div className="h-64 bg-white rounded-lg shadow animate-pulse" />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-slate-600 mb-2">Tendência de Engajamento</div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#888" />
          <YAxis stroke="#888" tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(value: any) => (typeof value === "number" ? `${value.toFixed(1)}%` : value)} />
          <Legend />
          <Line type="monotone" dataKey="engagement" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Engagement (%)" />
          {showReach && <Line type="monotone" dataKey="reach" stroke="#10b981" strokeWidth={2} dot={false} name="Reach" />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EngagementChart;