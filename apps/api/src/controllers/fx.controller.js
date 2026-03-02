/**
 * FX Controller
 *
 * Handles FX rate endpoints:
 * - Admin: POST /api/admin/fx/usd-ves (set rate)
 * - Public: GET /api/fx/usd-ves (get current rate)
 */

const { success } = require('../utils/response');
const { services } = require('../composition/root');

const fxService = services.fxService;

/**
 * POST /api/admin/fx/usd-ves
 * Set the USD->VES exchange rate for a date
 * Body: { rate: number, date?: string (YYYY-MM-DD), source?: string }
 */
async function setUsdVesRate(req, res, next) {
  try {
    const { rate, date, source } = req.body;
    const userId = req.user?.userId || null;

    const result = await fxService.setRate({
      rate: Number(rate),
      date,
      source,
      userId,
    });

    res.status(200);
    success(res, result, 'Exchange rate set successfully');
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/fx/usd-ves
 * Get the current/latest USD->VES exchange rate
 */
async function getUsdVesRate(req, res, next) {
  try {
    const rate = await fxService.getLatestRate('USD', 'VES');

    if (!rate) {
      res.status(200);
      return success(res, null, 'No exchange rate available');
    }

    res.status(200);
    success(res, {
      rate: rate.rate,
      rateDate: rate.rateDate,
      source: rate.source,
      updatedAt: rate.updatedAt,
    }, 'Exchange rate retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  setUsdVesRate,
  getUsdVesRate,
};
