import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthAPI, UsersAPI } from "../api/services";
import { clearTokens, setTokens } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    try {
      const { data } = await UsersAPI.me();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const { data } = await AuthAPI.login(email, password);
    setTokens(data.access_token, data.refresh_token);
    await loadUser();
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  const isAdmin = user?.role?.name === "SUPER_ADMIN" || user?.role?.name === "ADMIN";

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
