import { useState} from "react";
import { useConsent } from "./ConsentContext";

export function CookiePreferencesModal({ onClose }) {
  const { consent, savePreferences } = useConsent();
  const [draft, setDraft] = useState({
    marketing: consent.marketing,
    functional: consent.functional,
  });

    function handleSave() {
        savePreferences(draft);
        onClose();
    }

    return (
        <div
      role="dialog"
      aria-label="Personalizar cookies"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "420px",
          width: "90%",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Preferencias de cookies</h2>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <input type="checkbox" checked disabled />
          Necesarias — siempre activas (login, carrito)
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <input
            type="checkbox"
            checked={draft.marketing}
            onChange={(e) => setDraft({ ...draft, marketing: e.target.checked })}
          />
          Marketing — Meta Pixel (Facebook/Instagram)
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <input
            type="checkbox"
            checked={draft.functional}
            onChange={(e) => setDraft({ ...draft, functional: e.target.checked })}
          />
          Funcionales de terceros — Asistente virtual (Voiceflow)
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleSave}>Guardar preferencias</button>
        </div>
      </div>
    </div>
  );
}