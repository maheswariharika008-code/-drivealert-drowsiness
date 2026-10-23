import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-3 h-3 rounded-full bg-safe shadow-glow_safe" />
          <span className="font-display font-bold text-xl tracking-tight">DriveAlert</span>
        </div>
        <div className="glass-panel p-8">
          <h1 className="text-2xl font-display font-bold mb-1">{title}</h1>
          <p className="text-sm text-cockpit-textMuted mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-danger mt-1">{message}</p>;
}

export const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-cockpit-hairline text-cockpit-textPrimary placeholder:text-cockpit-textMuted/60 focus:border-safe/60 outline-none transition";
