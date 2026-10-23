import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { Driver } from "../types";
import * as authApi from "../api/authApi";

interface AuthContextValue {
  user: Driver | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: authApi.RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setUser: (user: Driver) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadStoredUser(): Driver | null {
  const raw = localStorage.getItem("authUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Driver;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("authToken"));
  const [user, setUserState] = useState<Driver | null>(loadStoredUser());

  const persist = useCallback((nextToken: string, nextUser: Driver) => {
    localStorage.setItem("authToken", nextToken);
    localStorage.setItem("authUser", JSON.stringify(nextUser));
    setToken(nextToken);
    setUserState(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.loginDriver({ email, password });
      persist(result.token, result.user);
    },
    [persist]
  );

  const register = useCallback(
    async (payload: authApi.RegisterPayload) => {
      const result = await authApi.registerDriver(payload);
      persist(result.token, result.user);
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUserState(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.getProfile();
    localStorage.setItem("authUser", JSON.stringify(profile));
    setUserState(profile);
  }, []);

  const setUser = useCallback((nextUser: Driver) => {
    localStorage.setItem("authUser", JSON.stringify(nextUser));
    setUserState(nextUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        refreshProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
