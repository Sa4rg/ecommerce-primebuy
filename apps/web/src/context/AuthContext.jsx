// web/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setAccessToken, clearAccessToken } from "../features/auth/authStorage";
import { login as apiLogin, logout as apiLogout } from "../features/auth/authCommand";
import { apiClient } from "../infrastructure/apiClient";

// ⚠️ httpOnly Cookies Migration
// Tokens are now in httpOnly cookies, not in localStorage or response bodies
// We verify authentication by calling /api/me instead of checking tokens

function getRoleFromUser(user) {
  return user?.role || null;
}

async function fetchMeSafe() {
  try {
    const me = await apiClient.get("/api/me");
    return me || null;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("checking"); // checking | ready
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      // ✅ Try to fetch /api/me (cookies sent automatically)
      // If cookies exist and are valid, backend returns user
      // If not, backend returns 401 and apiClient tries refresh automatically
      const me = await fetchMeSafe();
      
      if (!cancelled) {
        setUser(me);
        setStatus("ready");
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ Sync when auth state changes (login, logout, refresh)
  useEffect(() => {
    let cancelled = false;

    async function handleAuthStateChange(event) {
      const { authenticated } = event?.detail || {};

      if (!authenticated) {
        // User logged out
        setUser(null);
        return;
      }

      // User logged in or refreshed - reload user profile
      const me = await fetchMeSafe();
      if (!cancelled) setUser(me);
    }

    window.addEventListener("auth:state", handleAuthStateChange);
    return () => {
      cancelled = true;
      window.removeEventListener("auth:state", handleAuthStateChange);
    };
  }, []);

  const role = getRoleFromUser(user);
  const isAuthenticated = Boolean(user);

  async function login(credentials) {
    // ✅ Backend sets httpOnly cookies automatically
    // No need to extract or store tokens from response
    const data = await apiLogin(credentials);

    // Notify authStorage that user is authenticated
    setAccessToken("authenticated");

    // Cargar perfil
    const me = await fetchMeSafe();
    setUser(me);

    return data;
  }

  async function logout() {
    try {
      // ✅ Backend clears httpOnly cookies automatically
      await apiLogout();
    } catch {
      // ignore
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      status,
      token: user ? "authenticated" : "", // Legacy compatibility
      user,
      isAuthenticated,
      role,
      login,
      logout,
      setUser,
    }),
    [status, user, isAuthenticated, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}