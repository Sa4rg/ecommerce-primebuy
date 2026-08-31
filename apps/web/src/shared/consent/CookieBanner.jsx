import { useConsent } from "./ConsentContext";

export function CookieBanner() {
  const { consent, acceptAll, rejectAll } = useConsent();

  if (consent.status !== "pending") return null;

  return (
    <div
        role="dialog"
        aria-label="Aviso de cookies"
        style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#1a1a1a",
        color: "#fff",
        padding: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
        zIndex: 9999,
      }}
    >
      <p style={{ margin: 0, fontSize: "14px" }}>
        Usamos cookies necesarias para el funcionamiento del sitio, y con tu
        permiso, cookies de marketing (Meta) y de asistente virtual (Voiceflow).{" "}
        <a href="/privacy" style={{ color: "#8ab4f8" }}>
          Más información
        </a>
      </p>
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button onClick={rejectAll}>Rechazar</button>
        <button onClick={acceptAll}>Aceptar todo</button>
      </div>
    </div>
  );
}