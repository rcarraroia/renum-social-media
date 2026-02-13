import React from "react";

type Props = {
  data: Array<{ date: string; engagement: number; reach?: number }>;
  height?: number;
  showReach?: boolean;
  loading?: boolean;
};

const Skeleton = ({ height = 320 }: { height?: number }) => (
  <div className="bg-white rounded-lg shadow p-4 animate-pulse" style={{ height }} />
);

/**
 * EngagementChart dynamically imports recharts on the client to avoid
 * issues where a third-party library tries to access React internals
 * during module initialization (causes useRef/read null errors in dev).
 */
const EngagementChart: React.FC<Props> = ({ data = [], height = 320, showReach = false, loading = false }) => {
  const [Recharts, setRecharts] = React.useState<any | null>(null);

  React.useEffect(() => {
    let mounted = true;
    // Only run in browser
    if (typeof window === "undefined") return;
    // Dynamically import recharts
    import("recharts")
      .then((mod) => {
        if (mounted) setRecharts(mod);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load recharts", err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Skeleton height={height} />;

  if (!Recharts) {
    // while recharts is loading show skeleton
    return <Skeleton height={height} />;
  }

  const { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } = Recharts;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-slate-600 mb-2">Tendência de Engajamento</div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#888" />
          <YAxis stroke="#888" tickFormatter={(v: any) => `${v}%`} />
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