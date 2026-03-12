import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../../config";
import { setAccessToken, clearAccessToken } from "../authStorage";
import { useTranslation } from "../../../shared/i18n/useTranslation";

export function AuthCallbackView() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const error = params.get("error");
  const returnTo = params.get("returnTo") || "/account";

  const [status, setStatus] = useState("loading"); // loading | error
  const [err, setErr] = useState("");
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    let cancelled = false;

    async function run() {
      if (error) {
        if (!cancelled) {
          setStatus("error");
          setErr(error);
        }
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        const body = await res.json().catch(() => null);

        if (!res.ok || body?.success === false) {
          throw new Error(body?.message || `Refresh failed (${res.status})`);
        }

        const token = body?.data?.accessToken;
        if (!token) throw new Error("No accessToken in refresh response");

        setAccessToken(token);

        if (!cancelled) {
          window.location.replace(returnTo);
        }
      } catch (e) {
        clearAccessToken();
        if (!cancelled) {
          setStatus("error");
          setErr(e?.message || t("auth.callback.googleLoginFailed"));
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [error, returnTo, t]);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {status === "loading" ? (
        <p className="text-slate-300">{t("auth.callback.signingIn")}</p>
      ) : (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="font-bold text-red-200">
            {t("auth.callback.authenticationFailed")}
          </p>
          <p className="text-red-200/80">{err}</p>
        </div>
      )}
    </section>
  );
}