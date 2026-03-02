/**
 * FX Service
 *
 * Handles FX rate management for currency conversions (USD -> VES).
 *
 * Features:
 * - Set daily rate (admin)
 * - Get current/latest rate (public)
 * - Get rate for specific date
 */

const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../utils/errors');

function createFxService({ fxRatesRepository }) {
  if (!fxRatesRepository) {
    throw new Error('fxRatesRepository is required');
  }

  /**
   * Set or update the FX rate for a specific date
   * @param {Object} params
   * @param {number} params.rate - Exchange rate (e.g., 85.50 means 1 USD = 85.50 VES)
   * @param {string} [params.date] - YYYY-MM-DD, defaults to today
   * @param {string} [params.source] - Source of rate (manual, bcv, etc)
   * @param {string} [params.userId] - Admin user who set the rate
   * @returns {Promise<Object>} The created/updated rate
   */
  async function setRate({ rate, date, source = 'manual', userId = null }) {
    // Validate rate
    if (rate === undefined || rate === null || typeof rate !== 'number' || rate <= 0) {
      throw new AppError('Rate must be a positive number', 400);
    }

    // Default to today if no date provided
    const rateDate = date || new Date().toISOString().split('T')[0];

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rateDate)) {
      throw new AppError('Date must be in YYYY-MM-DD format', 400);
    }

    const result = await fxRatesRepository.upsertForDate(rateDate, {
      rateId: uuidv4(),
      rate,
      source,
      createdBy: userId,
      baseCurrency: 'USD',
      quoteCurrency: 'VES',
    });

    return result;
  }

  /**
   * Get the most recent FX rate
   * @param {string} [base='USD']
   * @param {string} [quote='VES']
   * @returns {Promise<Object|null>}
   */
  async function getLatestRate(base = 'USD', quote = 'VES') {
    return fxRatesRepository.findLatest(base, quote);
  }

  /**
   * Get FX rate for a specific date
   * @param {string} date - YYYY-MM-DD
   * @param {string} [base='USD']
   * @param {string} [quote='VES']
   * @returns {Promise<Object|null>}
   */
  async function getRateByDate(date, base = 'USD', quote = 'VES') {
    return fxRatesRepository.findByDate(date, base, quote);
  }

  /**
   * Convert USD to VES using the latest rate
   * @param {number} amountUSD
   * @returns {Promise<{ amountVES: number, rate: number, rateDate: string } | null>}
   */
  async function convertUsdToVes(amountUSD) {
    const latest = await getLatestRate('USD', 'VES');

    if (!latest) {
      return null;
    }

    return {
      amountVES: Math.round(amountUSD * latest.rate * 100) / 100,
      rate: latest.rate,
      rateDate: latest.rateDate,
      source: latest.source,
    };
  }

  return {
    setRate,
    getLatestRate,
    getRateByDate,
    convertUsdToVes,
  };
}

module.exports = { createFxService };
