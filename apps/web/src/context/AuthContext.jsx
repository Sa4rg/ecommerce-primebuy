// web/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAccessToken, setAccessToken, clearAccessToken } from "../features/auth/authStorage";
import { login as apiLogin, logout as apiLogout } from "../features/auth/authCommand";
import { apiClient } from "../infrastructure/apiClient";

function getRoleFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || "customer";
  } catch {
    return null;
  }
}

async function fetchMeSafe() {
  try {
    // Si no existe token, apiClient igual intentará refresh en 401,
    // pero aquí lo usamos cuando ya creemos estar auth.
    const me = await apiClient.get("/api/me");
    return me || null;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("checking"); // checking | ready
  const [token, setToken] = useState(() => getAccessToken() || "");
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const existing = getAccessToken();

      // 1) Si ya hay token en storage, marcamos ready y cargamos /api/me
      if (existing) {
        if (!cancelled) setToken(existing);

        const me = await fetchMeSafe();
        if (!cancelled) {
          setUser(me);
          setStatus("ready");
        }
        return;
      }

      // 2) Silent refresh para obtener token
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

        // Single source of truth
        setAccessToken(newToken);

        if (!cancelled) {
          setToken(newToken);
        }

        // 3) Ya con token, cargar perfil
        const me = await fetchMeSafe();
        if (!cancelled) {
          setUser(me);
          setStatus("ready");
        }
      } catch {
        clearAccessToken();
        if (!cancelled) {
          setToken("");
          setUser(null);
          setStatus("ready");
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ Sync when token changes outside AuthContext (e.g., apiClient refresh)
  useEffect(() => {
    let cancelled = false;

    async function handleTokenChange(event) {
      const nextToken = event?.detail || "";
      setToken(nextToken);

      // si se limpió token -> limpiar user
      if (!nextToken) {
        setUser(null);
        return;
      }

      // si llegó token nuevo (refresh), re-cargar user
      const me = await fetchMeSafe();
      if (!cancelled) setUser(me);
    }

    window.addEventListener("auth:token", handleTokenChange);
    return () => {
      cancelled = true;
      window.removeEventListener("auth:token", handleTokenChange);
    };
  }, []);

  const role = getRoleFromToken(token);
  const isAuthenticated = Boolean(token);

  async function login(credentials) {
    const data = await apiLogin(credentials);

    const nextToken = data?.accessToken;
    if (!nextToken) throw new Error("No accessToken returned from login");

    setAccessToken(nextToken);
    setToken(nextToken);

    // Cargar perfil
    const me = await fetchMeSafe();
    setUser(me);

    return data;
  }

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // ignore
    } finally {
      clearAccessToken();
      setToken("");
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      status,
      token,
      user, // ✅ nuevo
      isAuthenticated,
      role,
      login,
      logout,
      setToken, // optional
      setUser,  // optional (por si luego quieres actualizar profile local)
    }),
    [status, token, user, isAuthenticated, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}