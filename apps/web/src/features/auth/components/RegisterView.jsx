import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister } from "../authCommand";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCart } from "../../../context/CartContext.jsx";

export function RegisterView() {
  const nav = useNavigate();
  const { login } = useAuth();
  const { syncUserCart } = useCart();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const pwdMismatch = confirm.length > 0 && password !== confirm;

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (!name.trim()) return false;
    if (!email.trim()) return false;
    if (!password.trim()) return false;
    if (!confirm.trim()) return false;
    if (password !== confirm) return false;
    return true;
  }, [name, email, password, confirm, loading]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setErr("");
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const cleanName = name.trim();

      // 1) register
      await apiRegister({
        name: cleanName,
        email: cleanEmail,
        password,
      });

      // 2) auto-login (actualiza AuthContext)
      await login({ email: cleanEmail, password });

      // 3) sync cart with user's cart
      try {
        await syncUserCart();
      } catch {
        // Cart sync failure should not block registration
      }

      // 4) go to catalog
      nav("/", { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-[130px]" />

      {/* Card */}
      <div className="w-full max-w-[440px] rounded-xl border border-white/5 bg-[#1c1610] shadow-2xl">
        <div className="p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Create Account
            </h1>
            <p className="text-sm text-slate-400">
              Join ElectroVar and start shopping
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Full Name
              </label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-400 transition-colors">
                  👤
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-white/10 bg-[#282018] py-3 pl-11 pr-4 text-white placeholder:text-slate-500 outline-none transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/40"
                />
              </div>
            </div>

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
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-400 transition-colors">
                  🔒
                </span>

                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
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
                >
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Confirm Password
              </label>

              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-400 transition-colors">
                  ✅
                </span>

                <input
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className={[
                    "w-full rounded-lg border bg-[#282018] py-3 pl-11 pr-12 text-white placeholder:text-slate-500 outline-none transition-all focus:ring-2",
                    pwdMismatch
                      ? "border-red-500/40 focus:ring-red-500/20 focus:border-red-500/50"
                      : "border-white/10 focus:ring-orange-500/20 focus:border-orange-500/40",
                  ].join(" ")}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? "🙈" : "👁️"}
                </button>
              </div>

              {pwdMismatch && (
                <p className="text-xs text-red-200 ml-1">Passwords do not match.</p>
              )}
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
              {loading ? "Creating..." : "Create account"}
              <span className="text-lg">→</span>
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-orange-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
