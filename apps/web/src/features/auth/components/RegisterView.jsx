import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister } from "../authCommand";
import { useCart } from "../../../context/CartContext.jsx";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import { validatePassword } from "../../../shared/utils/passwordPolicy";

export function RegisterView() {
  const nav = useNavigate();
  const { syncUserCart } = useCart();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const pwdMismatch = confirm.length > 0 && password !== confirm;
  
  const pwdValidation = useMemo(() => validatePassword(password), [password]);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (!name.trim()) return false;
    if (!email.trim()) return false;
    if (!password.trim()) return false;
    if (!confirm.trim()) return false;
    if (password !== confirm) return false;
    if (!pwdValidation.valid) return false;
    return true;
  }, [name, email, password, confirm, loading, pwdValidation.valid]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setErr("");
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const cleanName = name.trim();

      await apiRegister({
        name: cleanName,
        email: cleanEmail,
        password,
      });

      nav("/verify-email", { state: { email: cleanEmail }, replace: true });
    } catch (e2) {
      setErr(e2?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pb-primary/10 blur-[130px]" />

      {/* Card */}
      <div className="w-full max-w-[440px] rounded-2xl border border-pb-border bg-white pb-shadow-lg">
        <div className="p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-pb-text mb-2">
              {t("auth.register.title")}
            </h1>
            <p className="text-sm text-pb-muted">
              {t("auth.register.subtitle")}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-pb-muted">
                {t("auth.register.nameLabel")}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-pb-muted group-focus-within:text-pb-primary transition-colors text-lg">
                  person
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("auth.register.namePlaceholder")}
                  className="w-full rounded-xl border border-pb-border bg-pb-bg-subtle py-3 pl-11 pr-4 text-pb-text placeholder:text-pb-muted outline-none transition-all focus:ring-2 focus:ring-pb-primary/20 focus:border-pb-primary"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-pb-muted">
                {t("auth.register.emailLabel")}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-pb-muted group-focus-within:text-pb-primary transition-colors text-lg">
                  mail
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.register.emailPlaceholder")}
                  className="w-full rounded-xl border border-pb-border bg-pb-bg-subtle py-3 pl-11 pr-4 text-pb-text placeholder:text-pb-muted outline-none transition-all focus:ring-2 focus:ring-pb-primary/20 focus:border-pb-primary"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-pb-muted">
                {t("auth.register.passwordLabel")}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-pb-muted group-focus-within:text-pb-primary transition-colors text-lg">
                  lock
                </span>

                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.register.passwordPlaceholder")}
                  className="w-full rounded-xl border border-pb-border bg-pb-bg-subtle py-3 pl-11 pr-12 text-pb-text placeholder:text-pb-muted outline-none transition-all focus:ring-2 focus:ring-pb-primary/20 focus:border-pb-primary"
                />

                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-pb-muted hover:text-pb-text transition-colors"
                  aria-label={showPwd ? t("auth.register.hidePassword") : t("auth.register.showPassword")}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPwd ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              
              {/* Password requirements */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-pb-muted font-medium">{t("auth.password.policyHeader")}</p>
                  <ul className="space-y-0.5 ml-1">
                    <li className={password.length >= 8 ? "text-emerald-600" : "text-pb-muted"}>
                      {password.length >= 8 ? "✓" : "○"} {t("auth.password.minLength")}
                    </li>
                    <li className={/[A-Z]/.test(password) ? "text-emerald-600" : "text-pb-muted"}>
                      {/[A-Z]/.test(password) ? "✓" : "○"} {t("auth.password.requiresUppercase")}
                    </li>
                    <li className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? "text-emerald-600" : "text-pb-muted"}>
                      {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? "✓" : "○"} {t("auth.password.requiresSpecial")}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-pb-muted">
                {t("auth.register.confirmPasswordLabel")}
              </label>

              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-pb-muted group-focus-within:text-pb-primary transition-colors text-lg">
                  task_alt
                </span>

                <input
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t("auth.register.confirmPasswordPlaceholder")}
                  className={[
                    "w-full rounded-xl border bg-pb-bg-subtle py-3 pl-11 pr-12 text-pb-text placeholder:text-pb-muted outline-none transition-all focus:ring-2",
                    pwdMismatch
                      ? "border-red-400 focus:ring-red-200 focus:border-red-500"
                      : "border-pb-border focus:ring-pb-primary/20 focus:border-pb-primary",
                  ].join(" ")}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-pb-muted hover:text-pb-text transition-colors"
                  aria-label={showConfirm ? t("auth.register.hidePassword") : t("auth.register.showPassword")}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showConfirm ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>

              {pwdMismatch && (
                <p className="text-xs text-red-600 ml-1">{t("auth.register.mismatch")}</p>
              )}
            </div>

            {/* Error */}
            {err && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="font-semibold">{t("auth.register.errorTitle")}</div>
                <div className="opacity-90">{err}</div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-pb-primary py-4 font-bold text-white shadow-lg shadow-pb-primary/20 transition-all hover:bg-pb-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? t("auth.register.signingUp") : t("auth.register.signUp")}
              <span className="text-lg">→</span>
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-pb-muted">
            {t("auth.register.haveAccount")}{" "}
            <Link to="/login" className="font-bold text-pb-primary hover:underline">
              {t("auth.register.goToLogin")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
