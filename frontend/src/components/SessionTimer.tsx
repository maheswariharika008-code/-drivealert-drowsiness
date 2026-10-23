import { useEffect, useState } from "react";

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function SessionTimer({ startTime }: { startTime: Date | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed((Date.now() - startTime.getTime()) / 1000);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startTime]);

  return (
    <span className="font-mono text-2xl mono-readout text-cockpit-textPrimary">
      {startTime ? formatDuration(elapsed) : "00:00:00"}
    </span>
  );
}
