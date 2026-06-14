"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  const requestSeqRef = useRef(0);

  const applyResult = useCallback(
    (result: Awaited<ReturnType<typeof getCurrentUser>>) => {
      if (result.ok) {
        setUser(result.user);
        setStatus("authenticated");
        return;
      }

      setUser(null);
      setStatus("unauthenticated");
    },
    [],
  );

  const refresh = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    setStatus("loading");
    const result = await getCurrentUser();

    if (seq === requestSeqRef.current) {
      applyResult(result);
    }
  }, [applyResult]);

  const clearUser = useCallback(() => {
    requestSeqRef.current += 1;
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    const seq = ++requestSeqRef.current;

    getCurrentUser().then((result) => {
      if (seq === requestSeqRef.current) {
        applyResult(result);
      }
    });
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
