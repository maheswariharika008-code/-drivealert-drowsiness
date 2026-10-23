import { apiClient } from "./client";
import type { ApiResponse, AlertRecord } from "../types";

export async function fetchAlertHistory(
  range: "today" | "week" | "month" | "all" = "week"
): Promise<AlertRecord[]> {
  const res = await apiClient.get<ApiResponse<AlertRecord[]>>("/alerts", { params: { range } });
  return res.data.data;
}
