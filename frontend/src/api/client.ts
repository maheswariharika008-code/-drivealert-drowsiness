import axios from "axios";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
export const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8001";
export const AI_SERVICE_WS_URL = AI_SERVICE_URL.replace(/^http/, "ws");
// Shared secret the AI service expects on its session start/stop endpoints.
// Fine for local/course-project use; for a real deployment this call should
// go through the backend instead of the browser calling the AI service directly.
export const AI_SERVICE_API_KEY = import.meta.env.VITE_AI_SERVICE_API_KEY || "";

export const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
