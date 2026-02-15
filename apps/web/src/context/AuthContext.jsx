import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAccessToken, setAccessToken, clearAccessToken } from "../features/auth/authStorage";
import { login as apiLogin } from "../features/auth/authCommand";

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

      // ✅ intenta refresh silencioso 1 vez
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        const body = await res.json().catch(() => null);
        if (!res.ok || body?.success === false) throw new Error(body?.message || "Refresh failed");

        const newToken = body?.data?.accessToken;
        if (!newToken) throw new Error("No accessToken in refresh response");

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

  const role = getRoleFromToken(token);
  const isAuthenticated = Boolean(token);

  function logout() {
    clearAccessToken();
    setToken("");
    // opcional: también pegarle a /api/auth/logout para invalidar refresh en servidor
  }

  async function login(credentials) {
    const data = await apiLogin(credentials);
    setToken(data.accessToken);
    return data;
  }

  const value = useMemo(
    () => ({
      status,
      token,
      isAuthenticated,
      role,
      login,
      logout,
      setToken, // por si quieres setearlo al hacer login
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
