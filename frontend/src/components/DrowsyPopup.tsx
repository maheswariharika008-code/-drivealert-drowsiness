interface DrowsyPopupProps {
  visible: boolean;
  fatigueScore: number;
  reasons: string[];
  onDismiss: () => void;
}

export function DrowsyPopup({ visible, fatigueScore, reasons, onDismiss }: DrowsyPopupProps) {
  if (!visible) return null;

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      className="fixed inset-0 z-50 flex items-center justify-center bg-danger/20 backdrop-blur-sm"
    >
      <div className="glass-panel border-danger/60 shadow-glow_danger max-w-md w-[90%] mx-4 p-8 text-center animate-pulseRing">
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-danger/15 border-2 border-danger flex items-center justify-center">
          <span className="text-3xl">⚠</span>
        </div>
        <h2 className="text-3xl font-display font-bold text-danger mb-2">Wake Up!</h2>
        <p className="text-lg text-cockpit-textPrimary mb-1">You appear to be sleepy.</p>
        <p className="text-sm text-cockpit-textMuted mb-6">
          Fatigue score {fatigueScore} — {reasons.join(", ") || "drowsiness detected"}. Please pull
          over safely and take a break.
        </p>
        <button
          onClick={onDismiss}
          className="px-6 py-3 rounded-xl bg-danger text-cockpit-bg font-semibold hover:brightness-110 transition"
        >
          I'm awake — dismiss alarm
        </button>
      </div>
    </div>
  );
}
