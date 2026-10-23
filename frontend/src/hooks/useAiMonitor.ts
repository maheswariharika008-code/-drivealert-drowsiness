import { useEffect, useRef, useState } from "react";
import { AI_SERVICE_WS_URL } from "../api/client";
import type { LiveMetrics } from "../types";

interface MonitorFrame {
  metrics: LiveMetrics;
  frame?: string; // base64 jpeg
}

interface UseAiMonitorResult {
  metrics: LiveMetrics | null;
  frameDataUrl: string | null;
  connected: boolean;
}

/** Subscribes to the AI service's live drowsiness feed while `active` is true. */
export function useAiMonitor(active: boolean): UseAiMonitorResult {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [frameDataUrl, setFrameDataUrl] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!active) {
      wsRef.current?.close();
      setConnected(false);
      return;
    }

    const ws = new WebSocket(`${AI_SERVICE_WS_URL}/ws/monitor`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const payload: MonitorFrame = JSON.parse(event.data);
        setMetrics(payload.metrics);
        if (payload.frame) {
          setFrameDataUrl(`data:image/jpeg;base64,${payload.frame}`);
        }
      } catch {
        // Ignore malformed frames rather than crashing the live view
      }
    };

    return () => {
      ws.close();
    };
  }, [active]);

  return { metrics, frameDataUrl, connected };
}
