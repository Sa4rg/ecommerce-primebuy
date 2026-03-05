// web/src/features/admin/components/AdminFxPage.jsx
import { useEffect, useState } from "react";
import { adminService } from "../adminService";
import { useTranslation } from "../../../shared/i18n/useTranslation.js";

export function AdminFxPage() {
  const { t } = useTranslation();
  const [currentRate, setCurrentRate] = useState(null);
  const [rateDate, setRateDate] = useState(null);
  const [newRate, setNewRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadCurrentRate();
  }, []);

  async function loadCurrentRate() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getFxRate();
      if (data && data.rate) {
        setCurrentRate(data.rate);
        setRateDate(data.rateDate?.split("T")[0] || data.date);
        setNewRate(data.rate.toString());
      } else {
        setCurrentRate(null);
        setRateDate(null);
      }
    } catch (err) {
      // No rate set yet is not an error
      setCurrentRate(null);
      setRateDate(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      setError(t("adminFx.invalidRate"));
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await adminService.setFxRate(rate);
      // If no error thrown, it was successful
      setCurrentRate(rate);
      setRateDate(new Date().toISOString().split("T")[0]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("FX Rate save error:", err);
      setError(err?.message || t("adminFx.errorSaving"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 bg-pb-bg">
        <p className="text-pb-text-secondary">Cargando...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 bg-pb-bg">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-pb-text-secondary mb-8">
        <span className="text-pb-text font-medium">{t("adminFx.title")}</span>
      </nav>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-pb-text">{t("adminFx.title")}</h1>
        <p className="text-pb-text-secondary mt-1">{t("adminFx.subtitle")}</p>
      </div>

      {/* Current Rate Card */}
      <div className="bg-pb-surface border border-pb-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-pb-text-secondary text-sm mb-1">{t("adminFx.currentRate")}</p>
            {currentRate ? (
              <>
                <p className="text-2xl font-bold text-pb-text">
                  1 USD = <span className="text-pb-primary">{currentRate.toLocaleString("es-VE")}</span> VES
                </p>
                <p className="text-pb-text-secondary text-sm mt-1">
                  {t("adminFx.lastUpdated")}: {rateDate}
                </p>
              </>
            ) : (
              <p className="text-lg text-pb-text-secondary">{t("adminFx.noRateSet")}</p>
            )}
          </div>
          <div className="text-4xl">💱</div>
        </div>
      </div>

      {/* Update Form */}
      <form onSubmit={handleSubmit} className="bg-pb-surface border border-pb-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-pb-text mb-4">
          {t("adminFx.updateRate")}
        </h2>

        <div className="mb-4">
          <label htmlFor="rate" className="block text-sm font-medium text-pb-text-secondary mb-2">
            {t("adminFx.newRateLabel")}
          </label>
          <div className="flex items-center gap-3">
            <span className="text-pb-text-secondary">1 USD =</span>
            <input
              type="number"
              id="rate"
              step="0.01"
              min="0.01"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              className="flex-1 bg-white border border-pb-border rounded-lg px-4 py-3 text-pb-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pb-primary focus:border-pb-primary"
              placeholder="36.50"
            />
            <span className="text-pb-text-secondary">VES</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {t("adminFx.success")}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-pb-primary hover:bg-pb-primary-hover disabled:bg-pb-primary/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {saving ? t("adminFx.saving") : t("adminFx.saveButton")}
        </button>
      </form>

      {/* Info */}
      <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
        <p className="text-orange-700 text-sm">
          💡 {t("adminFx.info")}
        </p>
      </div>
    </section>
  );
}
