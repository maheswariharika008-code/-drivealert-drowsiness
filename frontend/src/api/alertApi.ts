import { apiClient } from "./client";
import type { ApiResponse, AlertRecord, AlertStats, SessionRecord } from "../types";

export async function fetchAlerts(range: "today" | "week" | "month" | "all" = "today") {
  const res = await apiClient.get<ApiResponse<AlertRecord[]>>("/alerts", { params: { range } });
  return res.data.data;
}

export async function fetchAlertStats() {
  const res = await apiClient.get<ApiResponse<AlertStats>>("/alerts/stats");
  return res.data.data;
}

export async function startSession() {
  const res = await apiClient.post<ApiResponse<SessionRecord>>("/sessions/start");
  return res.data.data;
}

export async function stopSession(sessionId: string) {
  const res = await apiClient.post<ApiResponse<SessionRecord>>(`/sessions/${sessionId}/stop`);
  return res.data.data;
}

export async function fetchSessions(page = 1, limit = 20) {
  const res = await apiClient.get<
    ApiResponse<{ sessions: SessionRecord[]; total: number; page: number; limit: number }>
  >("/sessions", { params: { page, limit } });
  return res.data.data;
}
