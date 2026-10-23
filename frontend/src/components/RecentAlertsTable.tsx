import type { AlertRecord } from "../types";

const STATUS_STYLE: Record<string, string> = {
  Safe: "text-safe bg-safe/10 border-safe/30",
  Warning: "text-warn bg-warn/10 border-warn/30",
  Drowsy: "text-danger bg-danger/10 border-danger/30",
};

export function RecentAlertsTable({ alerts }: { alerts: AlertRecord[] }) {
  if (alerts.length === 0) {
    return (
      <div className="glass-panel p-8 text-center text-cockpit-textMuted text-sm">
        No alerts yet. A quiet log is a good sign.
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cockpit-hairline text-left text-cockpit-textMuted uppercase text-xs tracking-wider">
            <th className="px-5 py-3 font-medium">Time</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Score</th>
            <th className="px-5 py-3 font-medium">Reasons</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert._id} className="border-b border-cockpit-hairline/50 last:border-0">
              <td className="px-5 py-3 font-mono mono-readout text-cockpit-textMuted">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </td>
              <td className="px-5 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[alert.status]}`}
                >
                  {alert.status}
                </span>
              </td>
              <td className="px-5 py-3 font-mono mono-readout">{alert.fatigueScore}</td>
              <td className="px-5 py-3 text-cockpit-textMuted">{alert.reasons.join(", ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
