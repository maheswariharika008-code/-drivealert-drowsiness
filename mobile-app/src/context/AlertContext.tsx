import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { DrowsyPushData } from "../types";
import { subscribeToDrowsyAlerts } from "../services/notifications";
import { startAlarm, stopAlarm, unloadAlarm } from "../services/alarmService";
import { useAuth } from "./AuthContext";

interface AlertContextValue {
  activeAlert: DrowsyPushData | null;
  dismissAlert: () => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [activeAlert, setActiveAlert] = useState<DrowsyPushData | null>(null);
  const alarmRunning = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = subscribeToDrowsyAlerts((data) => {
      setActiveAlert(data);
    });

    return unsubscribe;
  }, [isAuthenticated]);

  // Keep the alarm sound/vibration in sync with whether an alert is active,
  // separate from the subscription above so it reacts to dismissal too.
  useEffect(() => {
    if (activeAlert && !alarmRunning.current) {
      alarmRunning.current = true;
      startAlarm();
    } else if (!activeAlert && alarmRunning.current) {
      alarmRunning.current = false;
      stopAlarm();
    }
  }, [activeAlert]);

  useEffect(() => {
    return () => {
      unloadAlarm();
    };
  }, []);

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  return (
    <AlertContext.Provider value={{ activeAlert, dismissAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
}
