import type { AlertStatus } from "../types";

interface VigilanceGaugeProps {
  score: number; // 0-10+ fatigue score
  status: AlertStatus | "Idle";
  maxScore?: number;
}

const STATUS_COLOR: Record<string, string> = {
  Safe: "#22D3B0",
  Warning: "#FBBF24",
  Drowsy: "#FB4141",
  Idle: "#3A4552",
};

const STATUS_GLOW: Record<string, string> = {
  Safe: "drop-shadow(0 0 6px rgba(34,211,176,0.7))",
  Warning: "drop-shadow(0 0 6px rgba(251,191,36,0.7))",
  Drowsy: "drop-shadow(0 0 8px rgba(251,65,65,0.9))",
  Idle: "none",
};

/**
 * The dashboard's signature element: an instrument-cluster style radial
 * gauge. The arc fills proportionally to the fatigue score and the needle
 * color sweeps from teal (safe) through amber to red (drowsy) — read at a
 * glance the way a driver reads a speedometer, not a dashboard widget.
 */
export function VigilanceGauge({ score, status, maxScore = 10 }: VigilanceGaugeProps) {
  const clamped = Math.min(score, maxScore);
  const pct = clamped / maxScore;
  const startAngle = -220;
  const sweepAngle = 260 * pct;
  const radius = 80;
  const cx = 100;
  const cy = 100;

  const toXY = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const start = toXY(startAngle);
  const end = toXY(startAngle + sweepAngle);
  const largeArc = sweepAngle > 180 ? 1 : 0;

  const trackStart = toXY(startAngle);
  const trackEnd = toXY(startAngle + 260);

  const color = STATUS_COLOR[status] ?? STATUS_COLOR.Idle;
  const glow = STATUS_GLOW[status] ?? STATUS_GLOW.Idle;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-56 h-56">
        {/* Background track */}
        <path
          d={`M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 1 1 ${trackEnd.x} ${trackEnd.y}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Score arc */}
        {pct > 0 && (
          <path
            d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            style={{ filter: glow, transition: "all 0.4s ease" }}
          />
        )}
        {/* Tick marks */}
        {Array.from({ length: 11 }).map((_, i) => {
          const tickAngle = startAngle + (260 * i) / 10;
          const outer = toXY(tickAngle);
          const rad = (tickAngle * Math.PI) / 180;
          const inner = { x: cx + (radius - 12) * Math.cos(rad), y: cy + (radius - 12) * Math.sin(rad) };
          return (
            <line
              key={i}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="2"
            />
          );
        })}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-5xl font-bold mono-readout" style={{ color, transition: "color 0.4s ease" }}>
          {score}
        </span>
        <span className="text-xs uppercase tracking-[0.2em] text-cockpit-textMuted mt-1">
          Fatigue Score
        </span>
        <span
          className="mt-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
          style={{ color, backgroundColor: `${color}1A`, border: `1px solid ${color}55` }}
        >
          {status}
        </span>
      </div>
    </div>
  );
}
