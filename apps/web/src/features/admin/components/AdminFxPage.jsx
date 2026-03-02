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
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-slate-300">Cargando...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <span className="text-white font-medium">{t("adminFx.title")}</span>
      </nav>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t("adminFx.title")}</h1>
        <p className="text-slate-400 mt-1">{t("adminFx.subtitle")}</p>
      </div>

      {/* Current Rate Card */}
      <div className="bg-black/20 border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">{t("adminFx.currentRate")}</p>
            {currentRate ? (
              <>
                <p className="text-2xl font-bold text-white">
                  1 USD = <span className="text-orange-400">{currentRate.toLocaleString("es-VE")}</span> VES
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  {t("adminFx.lastUpdated")}: {rateDate}
                </p>
              </>
            ) : (
              <p className="text-lg text-slate-500">{t("adminFx.noRateSet")}</p>
            )}
          </div>
          <div className="text-4xl">💱</div>
        </div>
      </div>

      {/* Update Form */}
      <form onSubmit={handleSubmit} className="bg-black/20 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          {t("adminFx.updateRate")}
        </h2>

        <div className="mb-4">
          <label htmlFor="rate" className="block text-sm font-medium text-slate-300 mb-2">
            {t("adminFx.newRateLabel")}
          </label>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">1 USD =</span>
            <input
              type="number"
              id="rate"
              step="0.01"
              min="0.01"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="36.50"
            />
            <span className="text-slate-400">VES</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
            {t("adminFx.success")}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {saving ? t("adminFx.saving") : t("adminFx.saveButton")}
        </button>
      </form>

      {/* Info */}
      <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
        <p className="text-orange-300 text-sm">
          💡 {t("adminFx.info")}
        </p>
      </div>
    </section>
  );
}
