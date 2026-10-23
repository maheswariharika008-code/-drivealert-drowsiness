import { AI_SERVICE_URL, AI_SERVICE_API_KEY } from "./client";

/** Tells the AI service to open the webcam and start detecting for this driver/session. */
export async function startAiSession(driverId: string, sessionId: string): Promise<void> {
  const url = `${AI_SERVICE_URL}/api/session/start?driver_id=${encodeURIComponent(
    driverId
  )}&session_id=${encodeURIComponent(sessionId)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-api-key": AI_SERVICE_API_KEY },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI service failed to start session: ${res.status} ${body}`);
  }
}

/** Tells the AI service to release the webcam and stop detecting. */
export async function stopAiSession(): Promise<void> {
  const url = `${AI_SERVICE_URL}/api/session/stop`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-api-key": AI_SERVICE_API_KEY },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI service failed to stop session: ${res.status} ${body}`);
  }
}
