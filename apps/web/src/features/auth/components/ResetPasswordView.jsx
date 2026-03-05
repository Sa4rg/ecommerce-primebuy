import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../authCommand";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import { validatePassword } from "../../../shared/utils/passwordPolicy";

export function ResetPasswordView() {
  const { t } = useTranslation();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const mismatch = confirm.length > 0 && newPassword !== confirm;
  
  // Password policy validation
  const pwdValidation = useMemo(() => validatePassword(newPassword), [newPassword]);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (!email.trim()) return false;
    if (!code.trim()) return false;
    if (!newPassword.trim()) return false;
    if (!confirm.trim()) return false;
    if (newPassword !== confirm) return false;
    if (!pwdValidation.valid) return false;
    return true;
  }, [email, code, newPassword, confirm, loading, pwdValidation.valid]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setErr("");
    setLoading(true);

    try {
      await resetPassword({ email, code, newPassword });
      nav("/login", { replace: true, state: { reset: "ok" } });
    } catch (e2) {
      setErr(e2?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 overflow-hidden bg-pb-bg">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pb-primary/5 blur-[130px]" />

      <div className="w-full max-w-[440px] rounded-xl border border-pb-border bg-white shadow-xl">
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-pb-text mb-2">
              {t("auth.reset.title")}
            </h1>
            <p className="text-sm text-pb-text-secondary">
              {t("auth.reset.subtitle")}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-pb-text-secondary">
                {t("auth.common.emailLabel")}
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-pb-border bg-white py-3 px-4 text-pb-text placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pb-primary/20 focus:border-pb-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-pb-text-secondary">
                {t("auth.reset.codeLabel")}
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-lg border border-pb-border bg-white py-3 px-4 text-pb-text placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pb-primary/20 focus:border-pb-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-pb-text-secondary">
                {t("auth.reset.newPasswordLabel")}
              </label>

              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-pb-border bg-white py-3 pl-4 pr-12 text-pb-text placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pb-primary/20 focus:border-pb-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-pb-text-secondary hover:text-pb-text transition-colors"
                  aria-label={showPwd ? t("auth.reset.hidePassword") : t("auth.reset.showPassword")}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPwd ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              
              {/* Password requirements */}
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-pb-text-secondary font-medium">{t("auth.password.policyHeader")}</p>
                  <ul className="space-y-0.5 ml-1">
                    <li className={newPassword.length >= 8 ? "text-green-600" : "text-pb-text-secondary"}>
                      {newPassword.length >= 8 ? "✓" : "○"} {t("auth.password.minLength")}
                    </li>
                    <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : "text-pb-text-secondary"}>
                      {/[A-Z]/.test(newPassword) ? "✓" : "○"} {t("auth.password.requiresUppercase")}
                    </li>
                    <li className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword) ? "text-green-600" : "text-pb-text-secondary"}>
                      {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword) ? "✓" : "○"} {t("auth.password.requiresSpecial")}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-pb-text-secondary">
                {t("auth.reset.confirmPasswordLabel")}
              </label>
              <input
                type={showPwd ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={[
                  "w-full rounded-lg border bg-white py-3 px-4 text-pb-text placeholder:text-slate-400 outline-none focus:ring-2",
                  mismatch
                    ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                    : "border-pb-border focus:ring-pb-primary/20 focus:border-pb-primary",
                ].join(" ")}
              />
              {mismatch && (
                <p className="text-xs text-red-600 ml-1">{t("auth.reset.mismatch")}</p>
              )}
            </div>

            {err && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="font-semibold">{t("auth.reset.errorTitle")}</div>
                <div className="opacity-90">{err}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-lg bg-pb-primary py-4 font-bold text-white hover:bg-pb-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t("auth.reset.resetting") : t("auth.reset.resetPassword")}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link to="/forgot-password" className="text-pb-text-secondary hover:text-pb-primary">
                {t("auth.reset.needCode")}
              </Link>
              <Link to="/login" className="text-pb-text-secondary hover:text-pb-primary">
                {t("auth.common.backToLogin")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}