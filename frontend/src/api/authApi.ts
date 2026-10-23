import { apiClient } from "./client";
import type { ApiResponse, Driver } from "../types";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  vehicleNumber: string;
  profilePhoto?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResult {
  token: string;
  user: Driver;
}

export async function registerDriver(payload: RegisterPayload) {
  const res = await apiClient.post<ApiResponse<AuthResult>>("/auth/register", payload);
  return res.data.data;
}

export async function loginDriver(payload: LoginPayload) {
  const res = await apiClient.post<ApiResponse<AuthResult>>("/auth/login", payload);
  return res.data.data;
}

export async function forgotPassword(email: string) {
  const res = await apiClient.post<ApiResponse<null>>("/auth/forgot-password", { email });
  return res.data.message;
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await apiClient.post<ApiResponse<null>>("/auth/reset-password", {
    token,
    newPassword,
  });
  return res.data.message;
}

export async function getProfile() {
  const res = await apiClient.get<ApiResponse<Driver>>("/auth/profile");
  return res.data.data;
}

export async function updateProfile(payload: Partial<RegisterPayload>) {
  const res = await apiClient.put<ApiResponse<Driver>>("/auth/profile", payload);
  return res.data.data;
}

export async function registerDeviceToken(fcmToken: string) {
  const res = await apiClient.post<ApiResponse<{ fcmTokens: string[] }>>("/auth/device-token", {
    fcmToken,
  });
  return res.data.data;
}
