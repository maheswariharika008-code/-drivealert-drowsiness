interface LiveFeedProps {
  frameDataUrl: string | null;
  connected: boolean;
  faceVisible: boolean;
}

export function LiveFeed({ frameDataUrl, connected, faceVisible }: LiveFeedProps) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm uppercase tracking-wider text-cockpit-textMuted">Live Camera Feed</h3>
        <span className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-safe animate-pulse" : "bg-danger"}`}
          />
          {connected ? "Streaming" : "Disconnected"}
        </span>
      </div>
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
        {frameDataUrl ? (
          <img src={frameDataUrl} alt="Live driver monitoring feed" className="w-full h-full object-cover" />
        ) : (
          <p className="text-cockpit-textMuted text-sm">
            {connected ? "Waiting for camera frame…" : "Start a session to connect the camera"}
          </p>
        )}
        {connected && !faceVisible && (
          <div className="absolute inset-0 flex items-center justify-center bg-danger/20">
            <span className="px-4 py-2 rounded-lg bg-danger text-cockpit-bg font-semibold text-sm">
              NO FACE DETECTED
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
