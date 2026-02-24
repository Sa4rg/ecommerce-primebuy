import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../authCommand";
import { useTranslation } from "../../../shared/i18n/useTranslation";

export function ForgotPasswordView() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [err, setErr] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && status !== "loading";
  }, [email, status]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setErr("");
    setStatus("loading");

    try {
      await requestPasswordReset({ email });
      // Importante: no revelar si existe o no el email
      setStatus("success");
    } catch (e2) {
      setErr(e2?.message || "Failed to request reset");
      setStatus("error");
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-[130px]" />

      <div className="w-full max-w-[440px] rounded-xl border border-white/5 bg-[#1c1610] shadow-2xl">
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              {t("auth.forgot.title")}
            </h1>
            <p className="text-sm text-slate-400">
              {t("auth.forgot.subtitle")}
            </p>
          </div>

          {status === "success" ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-5">
              <p className="text-white font-semibold">{t("auth.forgot.checkEmail")}</p>
              <p className="text-sm text-slate-300 mt-1">
                {t("auth.forgot.emailSent")}
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <Link
                  to="/reset-password"
                  className="w-full text-center rounded-lg bg-orange-500 py-3 font-bold text-white hover:bg-orange-500/90 transition-colors"
                >
                  {t("auth.forgot.iHaveCode")}
                </Link>

                <Link
                  to="/login"
                  className="w-full text-center rounded-lg border border-white/10 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5 transition-colors"
                >
                  {t("auth.forgot.backToLogin")}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t("auth.common.emailLabel")}
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

              {status === "error" && err && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <div className="font-semibold">{t("auth.forgot.errorTitle")}</div>
                  <div className="opacity-90">{err}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-lg bg-orange-500 py-4 font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-500/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "loading" ? t("auth.forgot.sending") : t("auth.forgot.sendCode")}
              </button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-slate-400 hover:text-orange-400">
                  {t("auth.common.backToLogin")}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}