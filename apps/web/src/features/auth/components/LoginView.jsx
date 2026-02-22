// src/features/auth/components/LoginView.jsx
import { useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCart } from "../../../context/CartContext.jsx";
import { API_BASE_URL } from "../../../config";

export function LoginView() {
  const nav = useNavigate();
  const location = useLocation();

  const { login } = useAuth();
  const { syncUserCart } = useCart();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const mountedRef = useRef(true);
  mountedRef.current = true;

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0 && !loading;
  }, [email, password, loading]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setErr("");
    setLoading(true);

    try {
      await login({ email: email.trim(), password });

      try {
        await syncUserCart();
      } catch {
        // ignore
      }

      const next = location.state?.from?.pathname || "/checkout";
      nav(next, { replace: true });
    } catch (e2) {
      if (mountedRef.current) setErr(e2?.message || "Login failed");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  function handleGoogleLogin() {
    // Importante: backend debe hacer OAuth y luego redirect al FE a /auth/callback
    const returnTo = location.state?.from?.pathname || "/checkout";
    const url = `${API_BASE_URL}/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
    window.location.href = url;
  }

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* Glow background */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-[130px]" />

      {/* Card */}
      <div className="w-full max-w-[440px] rounded-xl border border-white/5 bg-[#1c1610] shadow-2xl">
        <div className="p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-400">
              Log in to your ElectroVar account
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>

              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-400 transition-colors">
                  ✉️
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-white/10 bg-[#282018] py-3 pl-11 pr-4 text-white placeholder:text-slate-500 outline-none transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/40"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>

                {/* ✅ ahora es link real */}
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-orange-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-400 transition-colors">
                  🔒
                </span>

                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-[#282018] py-3 pl-11 pr-12 text-white placeholder:text-slate-500 outline-none transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/40"
                />

                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  title={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Error */}
            {err && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <div className="font-semibold">Something went wrong</div>
                <div className="opacity-90">{err}</div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-lg bg-orange-500 py-4 font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-500/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? "Signing in..." : "Sign In"}
              <span className="text-lg">→</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1c1610] px-3 text-slate-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* ✅ Social buttons (Google only for now) */}
          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5 transition-colors"
              onClick={handleGoogleLogin}
            >
              <span>🟦</span> Continue with Google
            </button>
          </div>

          {/* Footer link */}
          <p className="mt-10 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="font-bold text-orange-400 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}