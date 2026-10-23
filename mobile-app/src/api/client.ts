import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

export const BACKEND_URL: string =
  (Constants.expoConfig?.extra?.backendUrl as string) || "http://localhost:5000";

export const TOKEN_KEY = "driveAlert.authToken";

export const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
