import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslation.js";
import PrimeBuyLogo from "../../assets/primebuy-logo-whitefont.png";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function FooterLink({ to, children }) {
  return (
    <Link to={to} className="text-sm text-slate-400 hover:text-orange-400 transition-colors">
      {children}
    </Link>
  );
}

function FooterAnchor({ href, children, ariaLabel }) {
  return (
    <a
      href={href}
      className="text-sm text-slate-400 hover:text-orange-400 transition-colors"
      target="_blank"
      rel="noreferrer"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {children}
    </a>
  );
}

function toDigitsPhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function buildWhatsAppLink({ phoneDigits, message }) {
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${phoneDigits}${text ? `?text=${text}` : ""}`;
}

function buildGoogleMapsSearchUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function Footer() {
  const { t, language } = useTranslation();

  // ✅ Valores reales de producción (no dependen de i18n)
  const email = "cyaimport.c.a@gmail.com";

  // Visible para humano
  const phoneDisplay = "+58 412 621 6402";
  // Para wa.me (solo dígitos)
  const phoneDigits = "584126216402";

  const address =
    language === "en"
      ? "Valle Topacion Etapa 3, Los Jarales, San Diego, Carabobo, Venezuela"
      : "Valle Topacion Etapa 3, Los Jarales, San Diego, Carabobo, Venezuela";

  const mapsUrl = buildGoogleMapsSearchUrl(address);

  const whatsappUrl = buildWhatsAppLink({
    phoneDigits,
    message: t("support.whatsappMessageGeneral", { fallback: "Hola, necesito ayuda con una consulta en Prime Buy." }),
  });

  return (
    <footer
      id="site-footer"
      className="mt-16 border-t border-white/10 bg-[#221910]/70 backdrop-blur-md"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top */}
        <div className="py-12 grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center">
              <img src={PrimeBuyLogo} alt="Prime Buy" className="h-10 w-auto object-contain" />
            </div>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              {t("footer.brandDescription")}
            </p>
          </div>

          {/* Support (se mantiene, pero ahora debe apuntar a páginas reales) */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">
              {t("footer.support.title")}
            </h4>

            <div className="mt-4 flex flex-col gap-2">
              <FooterLink to="/support/faq">{t("footer.support.faq")}</FooterLink>
              <FooterLink to="/support/shipping">{t("footer.support.shipping")}</FooterLink>
              <FooterLink to="/support/returns">{t("footer.support.returns")}</FooterLink>
              <FooterLink to="/support/warranty">{t("footer.support.warranty")}</FooterLink>
            </div>
          </div>

          {/* Contact */}
          <div id="contact">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">
              {t("footer.contact.title")}
            </h4>

            <div className="mt-4 space-y-3">
              {/* Email */}
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-orange-400 text-base">mail</span>
                <a
                  href={`mailto:${email}`}
                  className="text-sm text-slate-400 hover:text-orange-400 transition-colors"
                >
                  {email}
                </a>
              </div>

              {/* WhatsApp (en vez de tel:) */}
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-orange-400 text-base">call</span>
                <FooterAnchor href={whatsappUrl} ariaLabel="WhatsApp">
                  {phoneDisplay}
                </FooterAnchor>
              </div>

              {/* Maps */}
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-orange-400 text-base">location_on</span>
                <FooterAnchor href={mapsUrl} ariaLabel="Google Maps">
                  {address}
                </FooterAnchor>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Prime Buy. {t("footer.rights")}
          </p>

          <div className="flex items-center gap-6">
            <FooterLink to="/terms">{t("footer.legal.terms")}</FooterLink>
            <FooterLink to="/privacy">{t("footer.legal.privacy")}</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}