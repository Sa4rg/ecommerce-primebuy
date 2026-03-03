import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { verifyEmail, resendVerification } from "../authCommand";
import { setAccessToken } from "../authStorage";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCart } from "../../../context/CartContext.jsx";
import { useTranslation } from "../../../shared/i18n/useTranslation";

export function VerifyEmailView() {
  const nav = useNavigate();
  const location = useLocation();
  const { setToken, setUser } = useAuth();
  const { syncUserCart } = useCart();
  const { t } = useTranslation();

  const email = location.state?.email || "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [err, setErr] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) nav("/register", { replace: true });
  }, [email, nav]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) return;

    setErr("");
    setLoading(true);

    try {
      const result = await verifyEmail({ email, code: code.trim() });
      
      // Set auth state with tokens
      if (result.accessToken) {
        setAccessToken(result.accessToken);
        setToken(result.accessToken);
        if (result.user) {
          setUser(result.user);
        }
      }

      // Sync cart
      try {
        await syncUserCart();
      } catch {
        // Cart sync failure should not block verification
      }

      nav("/", { replace: true });
    } catch (e2) {
      setErr(e2?.message || t("auth.verify.invalidCode"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    
    setResending(true);
    setErr("");
    setResendSuccess(false);

    try {
      await resendVerification({ email });
      setResendSuccess(true);
      setResendCooldown(60); // 60 second cooldown
    } catch (e2) {
      setErr(e2?.message || "Error");
    } finally {
      setResending(false);
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-[130px]" />

      <div className="w-full max-w-[440px] rounded-xl border border-white/5 bg-[#1c1610] shadow-2xl">
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">✉️</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {t("auth.verify.title")}
            </h1>
            <p className="text-sm text-neutral-400">
              {t("auth.verify.subtitle")} <strong className="text-white">{email}</strong>
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t("auth.verify.codeLabel")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 
                           px-4 py-4 text-white text-center text-3xl tracking-[0.5em] font-mono
                           focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="• • • • • •"
                autoFocus
                autoComplete="one-time-code"
              />
            </div>

            {err && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {err}
              </div>
            )}

            {resendSuccess && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                {t("auth.verify.resendSuccess")}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-orange-500 py-4 font-bold text-white shadow-lg shadow-orange-500/20 
                         transition-all hover:bg-orange-500/90 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? t("auth.verify.submitting") : t("auth.verify.submit")}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-400 mb-2">
              {t("auth.verify.resendPrompt")}
            </p>
            <button
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="text-orange-400 hover:text-orange-300 hover:underline disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {resending 
                ? t("auth.verify.resending")
                : resendCooldown > 0 
                  ? `${t("auth.verify.resendLink")} (${resendCooldown}s)`
                  : t("auth.verify.resendLink")
              }
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <Link to="/login" className="text-sm text-slate-400 hover:text-orange-400">
              {t("auth.common.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
