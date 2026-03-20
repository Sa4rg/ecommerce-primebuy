import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../../config";
import { setAccessToken, clearAccessToken } from "../authStorage";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import { sanitizeReturnTo } from "../../../shared/utils/sanitizeReturnTo";

// ⚠️ httpOnly Cookies Migration
// After OAuth callback, backend has already set httpOnly cookies
// We just need to verify authentication and redirect

export function AuthCallbackView() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const error = params.get("error");
  // Sanitize returnTo to prevent Open Redirect attacks (defense in depth)
  const returnTo = sanitizeReturnTo(params.get("returnTo"));

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
        // ✅ Backend already set httpOnly cookies during OAuth callback
        // Just verify they work by calling /api/me
        const res = await fetch(`${API_BASE_URL}/api/me`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const body = await res.json().catch(() => null);

        if (!res.ok || body?.success === false) {
          throw new Error(body?.message || `Authentication verification failed (${res.status})`);
        }

        // ✅ Authentication successful - notify AuthContext
        setAccessToken("authenticated");

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