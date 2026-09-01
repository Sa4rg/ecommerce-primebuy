import { Link } from "react-router-dom";
import { useState } from "react";
import { useConsent } from "../../../shared/consent/ConsentContext.jsx";
import { CookiePreferencesModal } from "../../../shared/consent/CookiePreferencesModal.jsx";

export function CookiePolicyPage() {
  const { consent } = useConsent();
  const [showPreferences, setShowPreferences] = useState(false);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <nav className="flex items-center gap-2 text-sm text-pb-text-secondary mb-8">
        <Link className="hover:text-pb-primary transition-colors" to="/">
          Inicio
        </Link>
        <span>/</span>
        <span className="text-pb-text font-medium">Política de Cookies</span>
      </nav>

      <div className="rounded-2xl border border-pb-border bg-white shadow-sm p-6 md:p-8">
        <h1 className="text-3xl font-extrabold text-pb-text">Política de Cookies</h1>

        <p className="mt-6 text-pb-text-secondary">
          Usamos distintos tipos de cookies para que el sitio funcione y,
          opcionalmente, para mostrarte publicidad relevante y ofrecerte
          asistencia por chat.
        </p>

        <div className="mt-8 space-y-6">
          <section>
            <h3 className="font-bold text-pb-text">Necesarias</h3>
            <p className="text-sm text-pb-text-secondary">
              Mantienen tu sesión iniciada y tu carrito de compras. No se pueden
              desactivar porque el sitio no funcionaría sin ellas.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-pb-text">Marketing (Meta Pixel)</h3>
            <p className="text-sm text-pb-text-secondary">
              Nos permite medir el rendimiento de nuestros anuncios en Facebook
              e Instagram. Solo se activan si das tu consentimiento.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-pb-text">Funcionales de terceros (Voiceflow)</h3>
            <p className="text-sm text-pb-text-secondary">
              Habilitan nuestro asistente virtual de chat. Solo se activan si
              das tu consentimiento.
            </p>
          </section>
        </div>

        <div className="mt-8 rounded-xl border border-pb-border bg-pb-surface p-5">
          <p className="text-sm text-pb-text-secondary mb-3">
            Tu preferencia actual: marketing{" "}
            <strong>{consent.marketing ? "activado" : "desactivado"}</strong>,
            asistente virtual{" "}
            <strong>{consent.functional ? "activado" : "desactivado"}</strong>.
          </p>
          <button
            onClick={() => setShowPreferences(true)}
            className="bg-pb-primary text-white font-semibold px-4 py-2 rounded-lg"
          >
            Cambiar mis preferencias
          </button>
        </div>
      </div>

      {showPreferences && (
        <CookiePreferencesModal onClose={() => setShowPreferences(false)} />
      )}
    </main>
  );
}