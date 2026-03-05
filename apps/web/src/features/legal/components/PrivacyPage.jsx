import { Link } from "react-router-dom";
import { useTranslation } from "../../../shared/i18n/useTranslation.js";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatToday(language) {
  const locale = language === "en" ? "en-US" : "es-VE";
  return new Date().toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit" });
}

export function PrivacyPage() {
  const { t, language } = useTranslation();

  const email = "cyaimport.c.a@gmail.com";
  const location = language === "en"
    ? "San Diego, Carabobo, Venezuela"
    : "San Diego, estado Carabobo, Venezuela";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-pb-text-secondary mb-8">
        <Link className="hover:text-pb-primary transition-colors" to="/">
          {language === "en" ? "Home" : "Inicio"}
        </Link>
        <span className="text-pb-text-secondary">/</span>
        <span className="text-pb-text font-medium">{t("legal.privacy.title")}</span>
      </nav>

      <div className="rounded-2xl border border-pb-border bg-white shadow-sm p-6 md:p-8">
        <h1 className="text-3xl font-extrabold text-pb-text">{t("legal.privacy.title")}</h1>
        <p className="mt-2 text-sm text-pb-text-secondary">
          {t("legal.common.updatedAt", { date: formatToday(language) })}
        </p>

        <p className="mt-6 text-pb-text-secondary">{t("legal.privacy.intro")}</p>
        <p className="mt-3 text-sm text-pb-text-secondary">{t("legal.common.scope")}</p>

        <div className="mt-8 space-y-6">
          <Section title={t("legal.privacy.sections.dataTitle")} text={t("legal.privacy.sections.dataText")} />
          <Section title={t("legal.privacy.sections.useTitle")} text={t("legal.privacy.sections.useText")} />
          <Section title={t("legal.privacy.sections.sharingTitle")} text={t("legal.privacy.sections.sharingText")} />
          <Section title={t("legal.privacy.sections.securityTitle")} text={t("legal.privacy.sections.securityText")} />
          <Section title={t("legal.privacy.sections.cookiesTitle")} text={t("legal.privacy.sections.cookiesText")} />
          <Section title={t("legal.privacy.sections.rightsTitle")} text={t("legal.privacy.sections.rightsText")} />
          <Section title={t("legal.privacy.sections.changesTitle")} text={t("legal.privacy.sections.changesText")} />
        </div>

        <div className="mt-10 rounded-xl border border-pb-border bg-pb-surface p-5">
          <h3 className="text-sm font-extrabold text-pb-text">{t("legal.common.contactTitle")}</h3>
          <div className="mt-2 space-y-1 text-sm text-pb-text-secondary">
            <p>{t("legal.common.contactEmail", { email })}</p>
            <p>{t("legal.common.location", { location })}</p>
          </div>
          <p className="mt-3 text-xs text-pb-text-secondary">{t("legal.common.disclaimer")}</p>
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