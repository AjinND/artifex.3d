"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
type User = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
};
const Auth = createContext<{
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
} | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, loading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (r) => (r.ok ? (await r.json()).data : null))
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => {})
      .finally(() => {
        if (active) loading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  function login(u: User) {
    setUser(u);
    const next = new URLSearchParams(location.search).get("next");
    router.push(
      next && /^\/(checkout|order)(\?|$)/.test(next)
        ? next
        : u.role === "admin"
          ? "/staff"
          : "/profile",
    );
  }
  async function logout() {
    const r = await fetch("/api/auth/logout", { method: "POST" });
    if (r.ok) {
      setUser(null);
      router.push("/login");
      router.refresh();
    }
  }
  return (
    <Auth.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </Auth.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(Auth);
  if (!ctx) throw new Error("Auth provider required");
  return ctx;
}
