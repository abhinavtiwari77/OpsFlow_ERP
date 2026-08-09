import { createContext, useContext, useState, ReactNode } from "react";
import { api } from "../api/client";
import { Role, normalizeRole } from "../../../shared/permissions";

type User = { id: string; name: string; email: string; role: Role };

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      const role = normalizeRole(parsed.role);
      if (!role) return null; // Drop invalid role
      return { ...parsed, role };
    } catch {
      return null;
    }
  });

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    const role = normalizeRole(data.user.role);
    if (!role) {
      throw new Error("Invalid role received from server.");
    }
    
    const validUser = { ...data.user, role };
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(validUser));
    setUser(validUser);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
