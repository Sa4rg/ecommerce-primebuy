import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../authCommand";
import { useTranslation } from "../../../shared/i18n/useTranslation";

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

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (!email.trim()) return false;
    if (!code.trim()) return false;
    if (!newPassword.trim()) return false;
    if (!confirm.trim()) return false;
    if (newPassword !== confirm) return false;
    return true;
  }, [email, code, newPassword, confirm, loading]);

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
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-[130px]" />

      <div className="w-full max-w-[440px] rounded-xl border border-white/5 bg-[#1c1610] shadow-2xl">
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              {t("auth.reset.title")}
            </h1>
            <p className="text-sm text-slate-400">
              {t("auth.reset.subtitle")}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t("auth.common.emailLabel")}
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-white/10 bg-[#282018] py-3 px-4 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/40"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t("auth.reset.codeLabel")}
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-lg border border-white/10 bg-[#282018] py-3 px-4 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/40"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t("auth.reset.newPasswordLabel")}
              </label>

              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-[#282018] py-3 pl-4 pr-12 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPwd ? t("auth.reset.hidePassword") : t("auth.reset.showPassword")}
                >
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t("auth.reset.confirmPasswordLabel")}
              </label>
              <input
                type={showPwd ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={[
                  "w-full rounded-lg border bg-[#282018] py-3 px-4 text-white placeholder:text-slate-500 outline-none focus:ring-2",
                  mismatch
                    ? "border-red-500/40 focus:ring-red-500/20 focus:border-red-500/50"
                    : "border-white/10 focus:ring-orange-500/20 focus:border-orange-500/40",
                ].join(" ")}
              />
              {mismatch && (
                <p className="text-xs text-red-200 ml-1">{t("auth.reset.mismatch")}</p>
              )}
            </div>

            {err && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <div className="font-semibold">{t("auth.reset.errorTitle")}</div>
                <div className="opacity-90">{err}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-lg bg-orange-500 py-4 font-bold text-white hover:bg-orange-500/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t("auth.reset.resetting") : t("auth.reset.resetPassword")}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link to="/forgot-password" className="text-slate-400 hover:text-orange-400">
                {t("auth.reset.needCode")}
              </Link>
              <Link to="/login" className="text-slate-400 hover:text-orange-400">
                {t("auth.common.backToLogin")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}