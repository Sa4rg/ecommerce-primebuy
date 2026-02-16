// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "../features/auth/authStorage";
import { login as apiLogin, logout as apiLogout } from "../features/auth/authCommand";

function getRoleFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || "customer";
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("checking"); // checking | ready
  const [token, setToken] = useState(() => getAccessToken() || "");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const existing = getAccessToken();
      if (existing) {
        if (!cancelled) {
          setToken(existing);
          setStatus("ready");
        }
        return;
      }

      // Silent refresh
      try {
        const res = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        const body = await res.json().catch(() => null);
        if (!res.ok || body?.success === false) {
          throw new Error(body?.message || "Refresh failed");
        }

        const newToken = body?.data?.accessToken;
        if (!newToken) throw new Error("No accessToken in refresh response");

        // Single source of truth (storage) + keep local state in sync
        setAccessToken(newToken);

        if (!cancelled) {
          setToken(newToken);
          setStatus("ready");
        }
      } catch {
        clearAccessToken();
        if (!cancelled) {
          setToken("");
          setStatus("ready");
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ Keep React state in sync when token changes outside AuthContext (e.g., apiClient refresh)
  useEffect(() => {
    function handleTokenChange(event) {
      const nextToken = event?.detail || "";
      setToken(nextToken);
    }

    window.addEventListener("auth:token", handleTokenChange);
    return () => window.removeEventListener("auth:token", handleTokenChange);
  }, []);

  const role = getRoleFromToken(token);
  const isAuthenticated = Boolean(token);

  async function login(credentials) {
    const data = await apiLogin(credentials);

    const nextToken = data?.accessToken;
    if (!nextToken) throw new Error("No accessToken returned from login");

    // Persist + update state (Navbar updates without refresh)
    setAccessToken(nextToken);
    setToken(nextToken);

    return data;
  }

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // If backend fails, still clear client state
    } finally {
      clearAccessToken();
      setToken("");
    }
  }

  const value = useMemo(
    () => ({
      status,
      token,
      isAuthenticated,
      role,
      login,
      logout,
      setToken, // optional, if you rely on it elsewhere
    }),
    [status, token, isAuthenticated, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
