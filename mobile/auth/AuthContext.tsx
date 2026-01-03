import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiGoogle, apiLogin, apiMe, apiRefresh, apiRegister, Tokens } from "./api";
import { clearTokens, loadTokens, saveTokens } from "./tokenStore";

type AuthState = {
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  signUp(email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signInWithGoogle(idToken: string): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
  loadMe(): Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const t = await loadTokens();
      setAccessToken(t.access ?? null);
      setRefreshToken(t.refresh ?? null);
      setIsLoading(false);
    })();
  }, []);

  async function applyTokens(t: Tokens) {
    await saveTokens(t);
    setAccessToken(t.access_token);
    setRefreshToken(t.refresh_token);
  }

  async function signUp(email: string, password: string) {
    await apiRegister(email, password);
    const t = await apiLogin(email, password);
    await applyTokens(t);
    await loadMe();
  }

  async function signIn(email: string, password: string) {
    const t = await apiLogin(email, password);
    await applyTokens(t);
    await loadMe();
  }

  async function signInWithGoogle(idToken: string) {
    const t = await apiGoogle(idToken);
    await applyTokens(t);
    await loadMe();
  }

  async function signOut() {
    await clearTokens();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }

  async function refresh() {
    if (!refreshToken) return;
    const t = await apiRefresh(refreshToken);
    await applyTokens(t);
  }

  async function loadMe() {
    if (!accessToken) return;
    const me = await apiMe(accessToken);
    setUser(me);
  }

  const value = useMemo<AuthState>(
    () => ({
      isLoading,
      accessToken,
      refreshToken,
      user,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      refresh,
      loadMe,
    }),
    [isLoading, accessToken, refreshToken, user]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
