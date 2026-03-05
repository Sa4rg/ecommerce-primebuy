import { Link } from "react-router-dom";
import { useTranslation } from "../../../shared/i18n/useTranslation.js";
import { WHATSAPP_SUPPORT } from "../../../config.js";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatToday(language) {
  const locale = language === "en" ? "en-US" : "es-VE";
  return new Date().toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit" });
}

function buildWhatsAppLink({ phone, message }) {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${digits}?text=${text}`;
}

export function ShippingPage() {
  const { t, language } = useTranslation();

  const email = "cyaimport.c.a@gmail.com";
  const location = language === "en"
    ? "San Diego, Carabobo, Venezuela"
    : "San Diego, estado Carabobo, Venezuela";

  const supportHref = buildWhatsAppLink({
    phone: WHATSAPP_SUPPORT,
    message: t("support.common.whatsappMessageShipping"),
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <nav className="flex items-center gap-2 text-sm text-pb-text-secondary mb-8">
        <Link className="hover:text-pb-primary transition-colors" to="/">
          {language === "en" ? "Home" : "Inicio"}
        </Link>
        <span className="text-pb-text-secondary">/</span>
        <span className="text-pb-text font-medium">{t("support.shipping.title")}</span>
      </nav>

      <div className="rounded-2xl border border-pb-border bg-white shadow-sm p-6 md:p-8">
        <h1 className="text-3xl font-extrabold text-pb-text">{t("support.shipping.title")}</h1>
        <p className="mt-2 text-sm text-pb-text-secondary">
          {t("support.common.updatedAt", { date: formatToday(language) })}
        </p>

        <p className="mt-6 text-pb-text-secondary">{t("support.shipping.intro")}</p>
        <p className="mt-3 text-sm text-pb-text-secondary">{t("support.shipping.scope")}</p>

        <div className="mt-8 space-y-6">
          <Section title={t("support.shipping.sections.methodsTitle")} text={t("support.shipping.sections.methodsText")} />
          <Section title={t("support.shipping.sections.timesTitle")} text={t("support.shipping.sections.timesText")} />
          <Section title={t("support.shipping.sections.trackingTitle")} text={t("support.shipping.sections.trackingText")} />
          <Section title={t("support.shipping.sections.addressTitle")} text={t("support.shipping.sections.addressText")} />
        </div>

        <div className="mt-10 rounded-xl border border-pb-border bg-pb-surface p-5">
          <h3 className="text-sm font-extrabold text-pb-text">{t("support.common.contactTitle")}</h3>
          <div className="mt-2 space-y-1 text-sm text-pb-text-secondary">
            <p>{t("support.common.contactEmail", { email })}</p>
            <p>{t("support.common.location", { location })}</p>
          </div>

          <div className="mt-4">
            <a
              href={supportHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-pb-border bg-pb-surface px-4 py-2 text-sm font-bold text-pb-primary hover:bg-slate-100 transition-colors"
            >
              💬 {t("support.common.contactWhatsapp")}
            </a>
          </div>

          <p className="mt-3 text-xs text-pb-text-secondary">{t("support.common.disclaimer")}</p>
        </div>

        <div className="mt-8">
          <Link
            to="/"
            className={cx(
              "inline-flex items-center gap-2 rounded-xl border border-pb-border bg-pb-surface px-4 py-2",
              "text-sm font-bold text-pb-text hover:bg-slate-100 transition-colors"
            )}
          >
            ← {language === "en" ? "Back to store" : "Volver a la tienda"}
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, text }) {
  return (
    <section>
      <h2 className="text-lg font-extrabold text-pb-text">{title}</h2>
      <p className="mt-2 text-pb-text-secondary leading-relaxed">{text}</p>
    </section>
  );
}