import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useAiMonitor } from "../hooks/useAiMonitor";
import { useAlertSocket } from "../hooks/useAlertSocket";
import { useAlarmSound } from "../hooks/useAlarmSound";
import * as alertApi from "../api/alertApi";
import * as aiServiceApi from "../api/aiServiceApi";
import type { AlertRecord, AlertStats, SessionRecord } from "../types";
import { VigilanceGauge } from "../components/VigilanceGauge";
import { LiveFeed } from "../components/LiveFeed";
import { StatCard } from "../components/StatCard";
import { SessionTimer } from "../components/SessionTimer";
import { RecentAlertsTable } from "../components/RecentAlertsTable";
import { ChartsPanel } from "../components/ChartsPanel";
import { DrowsyPopup } from "../components/DrowsyPopup";

export function DashboardPage() {
  const { user } = useAuth();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [starting, setStarting] = useState(false);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [popupDismissed, setPopupDismissed] = useState(false);

  const monitoring = session?.status === "active";
  const { metrics, frameDataUrl, connected } = useAiMonitor(monitoring);
  const alarm = useAlarmSound();

  const loadAlertsAndStats = useCallback(async () => {
    const [alertList, statsResult] = await Promise.all([
      alertApi.fetchAlerts("today"),
      alertApi.fetchAlertStats(),
    ]);
    setAlerts(alertList);
    setStats(statsResult);
  }, []);

  useEffect(() => {
    loadAlertsAndStats();
  }, [loadAlertsAndStats]);

  // Real-time alert stream from the backend (fires whenever the AI service posts an alert)
  useAlertSocket(
    useCallback((incoming: AlertRecord) => {
      setAlerts((prev) => [incoming, ...prev].slice(0, 50));
      if (incoming.status === "Drowsy") setPopupDismissed(false);
    }, [])
  );

  // Drive the alarm sound off the AI service's own live status, so it fires
  // even faster than waiting on the backend round-trip.
  useEffect(() => {
    const isDrowsy = metrics?.status === "Drowsy";
    if (isDrowsy && !popupDismissed) {
      alarm.start();
    } else {
      alarm.stop();
    }
    return () => alarm.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics?.status, popupDismissed]);

  const [aiError, setAiError] = useState<string | null>(null);

  const handleStart = async () => {
    setStarting(true);
    setAiError(null);
    try {
      const newSession = await alertApi.startSession();
      setSession(newSession);
      setPopupDismissed(false);
      // Tell the AI service to open the webcam for this session. If this
      // fails (e.g. AI service not running), the backend session still
      // exists — surface the error but don't block the dashboard.
      if (user) {
        try {
          await aiServiceApi.startAiSession(user.id, newSession._id);
        } catch (err) {
          setAiError(
            "Could not reach the AI service — make sure it's running (uvicorn main:app --port 8001)."
          );
          console.error(err);
        }
      }
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    if (!session) return;
    const ended = await alertApi.stopSession(session._id);
    setSession(ended);
    alarm.stop();
    try {
      await aiServiceApi.stopAiSession();
    } catch (err) {
      console.error(err);
    }
    loadAlertsAndStats();
  };

  const showPopup = metrics?.status === "Drowsy" && !popupDismissed;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-cockpit-textMuted">
            Vehicle {user?.vehicleNumber} — {monitoring ? "Session active" : "No active session"}
          </p>
        </div>
        {monitoring ? (
          <button
            onClick={handleStop}
            className="px-5 py-2.5 rounded-xl bg-danger text-cockpit-bg font-semibold hover:brightness-110 transition"
          >
            End session
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={starting}
            className="px-5 py-2.5 rounded-xl bg-safe text-cockpit-bg font-semibold hover:brightness-110 transition disabled:opacity-50"
          >
            {starting ? "Starting…" : "Start monitoring"}
          </button>
        )}
      </div>

      {aiError && (
        <div className="glass-panel border-warn/40 p-4 text-warn text-sm">{aiError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LiveFeed
          frameDataUrl={frameDataUrl}
          connected={connected}
          faceVisible={metrics?.face_visible ?? true}
        />

        <div className="glass-panel p-6 flex flex-col items-center justify-center">
          <VigilanceGauge
            score={metrics?.fatigue_score ?? 0}
            status={monitoring ? metrics?.status ?? "Idle" : "Idle"}
          />
        </div>

        <div className="glass-panel p-6 flex flex-col items-center justify-center gap-2">
          <p className="text-xs uppercase tracking-wider text-cockpit-textMuted">Session Timer</p>
          <SessionTimer startTime={session ? new Date(session.startTime) : null} />
          <div className="grid grid-cols-2 gap-3 w-full mt-4">
            <div className="text-center">
              <p className="font-mono text-xl mono-readout text-cockpit-textPrimary">
                {metrics?.blink_count ?? 0}
              </p>
              <p className="text-xs text-cockpit-textMuted">Blinks</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-xl mono-readout text-cockpit-textPrimary">
                {metrics?.yawn_count ?? 0}
              </p>
              <p className="text-xs text-cockpit-textMuted">Yawns</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Alerts" value={stats?.todayAlerts ?? 0} accent="danger" />
        <StatCard label="Weekly Alerts" value={stats?.weekAlerts ?? 0} accent="warn" />
        <StatCard label="Monthly Alerts" value={stats?.monthAlerts ?? 0} accent="neutral" />
        <StatCard
          label="EAR / MAR"
          value={`${metrics?.ear ?? "—"} / ${metrics?.mar ?? "—"}`}
          accent="safe"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartsPanel stats={stats} />
        </div>
        <div className="glass-panel p-5">
          <h3 className="text-sm uppercase tracking-wider text-cockpit-textMuted mb-4">
            Active Fatigue Signals
          </h3>
          {metrics && metrics.active_reasons && metrics.active_reasons.length > 0 ? (
            <ul className="space-y-2">
              {metrics.active_reasons.map((reason) => (
                <li
                  key={reason}
                  className="text-sm px-3 py-2 rounded-lg bg-warn/10 border border-warn/30 text-warn"
                >
                  {reason.replace(/_/g, " ")}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-cockpit-textMuted">No active signals — all clear.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm uppercase tracking-wider text-cockpit-textMuted mb-3">
          Recent Alerts (Today)
        </h3>
        <RecentAlertsTable alerts={alerts} />
      </div>

      <DrowsyPopup
        visible={showPopup}
        fatigueScore={metrics?.fatigue_score ?? 0}
        reasons={metrics?.active_reasons ?? []}
        onDismiss={() => setPopupDismissed(true)}
      />
    </div>
  );
}
