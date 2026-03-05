import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslation.js";
import PrimeBuyLogo from "../../assets/primebuy-logo-whitefont.png";

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-sm text-pb-text-secondary hover:text-pb-primary transition-colors"
    >
      {children}
    </Link>
  );
}

function FooterAnchor({ href, children, ariaLabel }) {
  return (
    <a
      href={href}
      className="text-sm text-pb-text-secondary hover:text-pb-primary transition-colors"
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

  const email = "cyaimport.c.a@gmail.com";
  const phoneDisplay = "+58 412 621 6402";
  const phoneDigits = "584126216402";

  const address =
    language === "en"
      ? "Valle Topacion Etapa 3, Los Jarales, San Diego, Carabobo, Venezuela"
      : "Valle Topacion Etapa 3, Los Jarales, San Diego, Carabobo, Venezuela";

  const mapsUrl = buildGoogleMapsSearchUrl(address);

  const whatsappUrl = buildWhatsAppLink({
    phoneDigits,
    message: t("support.whatsappMessageGeneral", {
      fallback: "Hola, necesito ayuda con una consulta en Prime Buy.",
    }),
  });

  return (
    <footer
      id="site-footer"
      className="mt-auto border-t border-pb-border-light bg-pb-surface"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top */}
        <div className="py-12 grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2">
              <img
                src={PrimeBuyLogo}
                alt="Prime Buy"
                className="h-10 w-auto object-contain"
              />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-pb-text">Prime</span>
                <span className="text-pb-primary">Buy</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-pb-text-secondary leading-relaxed max-w-xs">
              {t("footer.brandDescription")}
            </p>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-pb-text">
              {t("footer.support.title")}
            </h4>

            <div className="mt-4 flex flex-col gap-2">
              <FooterLink to="/support/faq">{t("footer.support.faq")}</FooterLink>
              <FooterLink to="/support/shipping">
                {t("footer.support.shipping")}
              </FooterLink>
              <FooterLink to="/support/returns">
                {t("footer.support.returns")}
              </FooterLink>
              <FooterLink to="/support/warranty">
                {t("footer.support.warranty")}
              </FooterLink>
            </div>
          </div>

          {/* Contact */}
          <div id="contact">
            <h4 className="text-sm font-bold uppercase tracking-wider text-pb-text">
              {t("footer.contact.title")}
            </h4>

            <div className="mt-4 space-y-3">
              {/* Email */}
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-pb-primary text-base">
                  mail
                </span>
                <a
                  href={`mailto:${email}`}
                  className="text-sm text-pb-text-secondary hover:text-pb-primary transition-colors"
                >
                  {email}
                </a>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-pb-primary text-base">
                  call
                </span>
                <FooterAnchor href={whatsappUrl} ariaLabel="WhatsApp">
                  {phoneDisplay}
                </FooterAnchor>
              </div>

              {/* Maps */}
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-pb-primary text-base">
                  location_on
                </span>
                <FooterAnchor href={mapsUrl} ariaLabel="Google Maps">
                  {address}
                </FooterAnchor>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-pb-border-light py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-pb-muted">
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
