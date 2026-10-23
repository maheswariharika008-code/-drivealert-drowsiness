import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AlertStats } from "../types";

export function ChartsPanel({ stats }: { stats: AlertStats | null }) {
  const data = (stats?.dailyBreakdown ?? []).map((d) => ({
    date: d._id.slice(5), // MM-DD
    alerts: d.totalAlerts,
    drowsy: d.drowsyAlerts,
    avgScore: Math.round(d.avgScore * 10) / 10,
  }));

  return (
    <div className="glass-panel p-5">
      <h3 className="text-sm uppercase tracking-wider text-cockpit-textMuted mb-4">
        Monthly Fatigue Trend
      </h3>
      {data.length === 0 ? (
        <p className="text-cockpit-textMuted text-sm py-12 text-center">
          Not enough data yet — trends appear after a few driving sessions.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="drowsyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FB4141" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#FB4141" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" stroke="#8B98A5" fontSize={12} />
            <YAxis stroke="#8B98A5" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "#0F151C",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="drowsy"
              name="Drowsy alerts"
              stroke="#FB4141"
              fill="url(#drowsyGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
