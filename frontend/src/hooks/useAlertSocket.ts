import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { BACKEND_URL } from "../api/client";
import type { AlertRecord } from "../types";
import { useAuth } from "../context/AuthContext";

/** Subscribes to the backend's per-driver room for real-time alert events. */
export function useAlertSocket(onAlert: (alert: AlertRecord) => void) {
  const { token, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const handlerRef = useRef(onAlert);
  handlerRef.current = onAlert;

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io(BACKEND_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("alert:new", (payload: AlertRecord) => handlerRef.current(payload));

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, token]);

  return { connected };
}
