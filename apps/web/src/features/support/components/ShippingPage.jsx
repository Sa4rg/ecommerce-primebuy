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
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link className="hover:text-orange-400 transition-colors" to="/">
          {language === "en" ? "Home" : "Inicio"}
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-100 font-medium">{t("support.shipping.title")}</span>
      </nav>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 md:p-8">
        <h1 className="text-3xl font-extrabold text-slate-100">{t("support.shipping.title")}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {t("support.common.updatedAt", { date: formatToday(language) })}
        </p>

        <p className="mt-6 text-slate-300">{t("support.shipping.intro")}</p>
        <p className="mt-3 text-sm text-slate-400">{t("support.shipping.scope")}</p>

        <div className="mt-8 space-y-6">
          <Section title={t("support.shipping.sections.methodsTitle")} text={t("support.shipping.sections.methodsText")} />
          <Section title={t("support.shipping.sections.timesTitle")} text={t("support.shipping.sections.timesText")} />
          <Section title={t("support.shipping.sections.trackingTitle")} text={t("support.shipping.sections.trackingText")} />
          <Section title={t("support.shipping.sections.addressTitle")} text={t("support.shipping.sections.addressText")} />
        </div>

        <div className="mt-10 rounded-xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-sm font-extrabold text-slate-100">{t("support.common.contactTitle")}</h3>
          <div className="mt-2 space-y-1 text-sm text-slate-300">
            <p>{t("support.common.contactEmail", { email })}</p>
            <p>{t("support.common.location", { location })}</p>
          </div>

          <div className="mt-4">
            <a
              href={supportHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-orange-300 hover:bg-white/10 transition-colors"
            >
              💬 {t("support.common.contactWhatsapp")}
            </a>
          </div>

          <p className="mt-3 text-xs text-slate-500">{t("support.common.disclaimer")}</p>
        </div>

        <div className="mt-8">
          <Link
            to="/"
            className={cx(
              "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2",
              "text-sm font-bold text-slate-200 hover:bg-white/10 transition-colors"
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
      <h2 className="text-lg font-extrabold text-slate-100">{title}</h2>
      <p className="mt-2 text-slate-300 leading-relaxed">{text}</p>
    </section>
  );
}