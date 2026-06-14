"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getCurrentUser } from "@/features/auth/services/authApi";
import type { AuthUser } from "@/features/auth/types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  refresh: () => Promise<void>;
  clearUser: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  const applyResult = useCallback((result: Awaited<ReturnType<typeof getCurrentUser>>) => {
    if (result.ok) {
      setUser(result.user);
      setStatus("authenticated");
      return;
    }

    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refresh = useCallback(async () => {
    setStatus("loading");
    applyResult(await getCurrentUser());
  }, [applyResult]);

  const clearUser = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    let isActive = true;

    getCurrentUser().then((result) => {
      if (isActive) {
        applyResult(result);
      }
    });

    return () => {
      isActive = false;
    };
  }, [applyResult]);

  return (
    <AuthContext.Provider value={{ status, user, refresh, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth は AuthProvider の内側で使用してください");
  }

  return context;
}
