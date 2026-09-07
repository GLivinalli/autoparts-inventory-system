import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "@/api/auth";
import type { User, UserPermissions } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  can: (action: keyof UserPermissions) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    try {
      const me = await authApi.fetchMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function login(email: string, password: string) {
    const loggedUser = await authApi.login(email, password);
    setUser(loggedUser);
  }

  async function logout() {
    await authApi.logout();
    setUser(null);
  }

  const isAdmin = user?.role === "ADMIN";

  function can(action: keyof UserPermissions) {
    if (!user) return false;
    if (isAdmin) return true;
    return Boolean(user.permission?.[action]);
  }

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser: loadUser, can, isAdmin }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
