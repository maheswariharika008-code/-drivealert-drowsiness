import { useCallback, useRef } from "react";

/**
 * Synthesizes a loud, urgent two-tone alarm using the Web Audio API so the
 * dashboard doesn't depend on shipping/loading an external audio file.
 * Call start() when status becomes "Drowsy" and stop() when it clears.
 */
export function useAlarmSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  const beep = useCallback((ctx: AudioContext, freq: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current !== null) return; // already running
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();

    const playPattern = () => {
      beep(ctx, 880, 0.18);
      window.setTimeout(() => beep(ctx, 660, 0.18), 220);
    };
    playPattern();
    intervalRef.current = window.setInterval(playPattern, 700);
  }, [beep]);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { start, stop };
}
