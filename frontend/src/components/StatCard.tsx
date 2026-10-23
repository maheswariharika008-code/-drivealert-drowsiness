import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: "safe" | "warn" | "danger" | "neutral";
}

const ACCENT_CLASSES: Record<string, string> = {
  safe: "text-safe",
  warn: "text-warn",
  danger: "text-danger",
  neutral: "text-cockpit-textPrimary",
};

export function StatCard({ label, value, icon, accent = "neutral" }: StatCardProps) {
  return (
    <div className="glass-panel p-5 flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-cockpit-textMuted mb-1">{label}</p>
        <p className={`font-mono text-2xl font-semibold mono-readout ${ACCENT_CLASSES[accent]}`}>
          {value}
        </p>
      </div>
      {icon && <div className="opacity-70">{icon}</div>}
    </div>
  );
}
