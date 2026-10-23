import { useEffect, useState } from "react";
import * as alertApi from "../api/alertApi";
import type { SessionRecord } from "../types";

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h}h ${m}m ${s}s`;
}

export function SessionHistoryPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await alertApi.fetchSessions();
        setSessions(result.sessions);
      } catch {
        setError("Could not load session history.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Session History</h1>
      <p className="text-sm text-cockpit-textMuted mb-6">Past driving sessions and their fatigue summaries.</p>

      {loading && <p className="text-cockpit-textMuted text-sm">Loading…</p>}
      {error && <p className="text-danger text-sm">{error}</p>}

      {!loading && !error && sessions.length === 0 && (
        <div className="glass-panel p-8 text-center text-cockpit-textMuted text-sm">
          No sessions yet. Start monitoring from the dashboard to begin your history.
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <div className="glass-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cockpit-hairline text-left text-cockpit-textMuted uppercase text-xs tracking-wider">
                <th className="px-5 py-3 font-medium">Start</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium">Avg Score</th>
                <th className="px-5 py-3 font-medium">Max Score</th>
                <th className="px-5 py-3 font-medium">Drowsy Alerts</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s._id} className="border-b border-cockpit-hairline/50 last:border-0">
                  <td className="px-5 py-3 font-mono mono-readout text-cockpit-textMuted">
                    {new Date(s.startTime).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 font-mono mono-readout">{formatDuration(s.durationSec)}</td>
                  <td className="px-5 py-3 font-mono mono-readout">{s.avgFatigueScore.toFixed(1)}</td>
                  <td className="px-5 py-3 font-mono mono-readout">{s.maxFatigueScore}</td>
                  <td className="px-5 py-3 font-mono mono-readout">{s.totalAlerts}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        s.status === "active"
                          ? "text-safe bg-safe/10 border-safe/30"
                          : "text-cockpit-textMuted bg-white/5 border-cockpit-hairline"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
