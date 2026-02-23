import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../../config";
import { setAccessToken, clearAccessToken } from "../authStorage";
import { useCart } from "../../../context/CartContext.jsx";

export function AuthCallbackView() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { syncUserCart } = useCart();
  const error = params.get("error");
  const returnTo = params.get("returnTo") || "/account";

  const [status, setStatus] = useState("loading"); // loading | error
  const [err, setErr] = useState("");

  useEffect(() => {
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

        //try { await syncUserCart(); } catch {}

        if (!cancelled) nav(returnTo, { replace: true });
        } catch (e) {
        clearAccessToken();
        if (!cancelled) {
            setStatus("error");
            setErr(e?.message || "Google login failed");
        }
        }
    }

    run();
    return () => { cancelled = true; };
    }, [error, returnTo, nav, syncUserCart]);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {status === "loading" ? (
        <p className="text-slate-300">Signing you in...</p>
      ) : (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="font-bold text-red-200">Authentication failed</p>
          <p className="text-red-200/80">{err}</p>
        </div>
      )}
    </section>
  );
}
