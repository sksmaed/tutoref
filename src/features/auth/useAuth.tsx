// hooks/useAuth.ts
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  fetchSession,
  login as apiLogin,
  logout as apiLogout,
} from "@/services/auth";
import { setFlash } from "@/lib/flash";

type AuthContextType = {
  loading: boolean;
  authenticated: boolean;
  user: any;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  const refresh = async () => {
    const s = await fetchSession();
    setAuthenticated(!!s?.authenticated);
    setUser(s?.user ?? null);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await fetchSession();
        if (!mounted) return;
        setAuthenticated(!!s?.authenticated);
        setUser(s?.user ?? null);
      } catch {
        if (!mounted) return;
        setAuthenticated(false);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading || !authenticated) return; // ✅ 未登入先別動旗標
    
    // 使用 setTimeout 來確保在下一個事件循環中處理，避免競爭條件
    const timeoutId = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem("oauthPostLoginFlash");
        if (raw) {
          try {
            const payload = JSON.parse(raw);
            setFlash(payload);
            console.log('oauthPostLoginFlash:', payload);
          } catch (error) {
            console.warn('Failed to parse oauthPostLoginFlash payload.', error);
          }
          sessionStorage.removeItem("oauthPostLoginFlash");
        }
      } catch {
        sessionStorage.removeItem("oauthPostLoginFlash");
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [loading, authenticated]);

  const login = async (email: string, password: string) => {
    await apiLogin(email, password);
    await refresh();
  };

  const logout = async () => {
    // 若後端尚未提供 /auth/logout/ 可先註解這行
    await apiLogout?.();
    await refresh();
  };

  const value: AuthContextType = {
    loading,
    authenticated,
    user,
    refresh,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
