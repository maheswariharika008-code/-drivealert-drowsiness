import { apiClient } from "./client";
import type { ApiResponse, Driver } from "../types";

interface AuthResult {
  token: string;
  user: Driver;
}

export async function loginDriver(email: string, password: string): Promise<AuthResult> {
  const res = await apiClient.post<ApiResponse<AuthResult>>("/auth/login", { email, password });
  return res.data.data;
}

export async function getProfile(): Promise<Driver> {
  const res = await apiClient.get<ApiResponse<Driver>>("/auth/profile");
  return res.data.data;
}

export async function registerDeviceToken(fcmToken: string): Promise<void> {
  await apiClient.post("/auth/device-token", { fcmToken });
}
