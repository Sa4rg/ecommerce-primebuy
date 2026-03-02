/**
 * MySQLFxRatesRepository
 * 
 * MySQL implementation of FxRatesRepository contract.
 * Uses Knex for database operations.
 * 
 * Contract:
 * - create(fxRate) -> returns { rateId }
 * - findByDate(date, base, quote) -> returns rate object or null
 * - findLatest(base, quote) -> returns rate object or null
 * - upsertForDate(date, rateData) -> returns rate object
 */

const db = require('../../db/knex');
const { isoToMySQLDatetime, mysqlDatetimeToISO } = require('../../utils/datetime');

class MySQLFxRatesRepository {
  constructor() {
    this.table = 'fx_rates';
  }

  /**
   * Map DB row to rate object
   * @private
   */
  _mapToRate(row) {
    if (!row) return null;
    
    return {
      rateId: String(row.rate_id),
      rateDate: row.rate_date, // DATE stays as string YYYY-MM-DD
      baseCurrency: row.base_currency,
      quoteCurrency: row.quote_currency,
      rate: parseFloat(row.rate),
      source: row.source || null,
      createdBy: row.created_by || null,
      createdAt: mysqlDatetimeToISO(row.created_at),
      updatedAt: mysqlDatetimeToISO(row.updated_at),
    };
  }

  /**
   * Map rate object to DB format
   * @private
   */
  _mapToDbFormat(rate) {
    return {
      rate_id: rate.rateId,
      rate_date: rate.rateDate,
      base_currency: rate.baseCurrency || 'USD',
      quote_currency: rate.quoteCurrency || 'VES',
      rate: rate.rate,
      source: rate.source || null,
      created_by: rate.createdBy || null,
      created_at: isoToMySQLDatetime(rate.createdAt),
      updated_at: isoToMySQLDatetime(rate.updatedAt),
    };
  }

  /**
   * Create new FX rate
   * @param {Object} rate
   * @returns {Promise<{ rateId: string }>}
   */
  async create(rate) {
    const dbData = this._mapToDbFormat(rate);
    await db(this.table).insert(dbData);
    return { rateId: rate.rateId };
  }

  /**
   * Find rate by date and currency pair
   * @param {string} date - YYYY-MM-DD
   * @param {string} base - Base currency (e.g. 'USD')
   * @param {string} quote - Quote currency (e.g. 'VES')
   * @returns {Promise<Object|null>}
   */
  async findByDate(date, base = 'USD', quote = 'VES') {
    const row = await db(this.table)
      .where({
        rate_date: date,
        base_currency: base,
        quote_currency: quote,
      })
      .first();
    return this._mapToRate(row);
  }

  /**
   * Find the most recent rate for a currency pair
   * @param {string} base - Base currency
   * @param {string} quote - Quote currency
   * @returns {Promise<Object|null>}
   */
  async findLatest(base = 'USD', quote = 'VES') {
    const row = await db(this.table)
      .where({
        base_currency: base,
        quote_currency: quote,
      })
      .orderBy('rate_date', 'desc')
      .first();
    return this._mapToRate(row);
  }

  /**
   * Upsert rate for a specific date (insert or update)
   * @param {string} date - YYYY-MM-DD
   * @param {Object} rateData
   * @returns {Promise<Object>}
   */
  async upsertForDate(date, rateData) {
    const existing = await this.findByDate(
      date,
      rateData.baseCurrency || 'USD',
      rateData.quoteCurrency || 'VES'
    );

    const now = new Date().toISOString();

    if (existing) {
      // Update existing
      await db(this.table)
        .where({ rate_id: existing.rateId })
        .update({
          rate: rateData.rate,
          source: rateData.source || existing.source,
          created_by: rateData.createdBy || existing.createdBy,
          updated_at: isoToMySQLDatetime(now),
        });

      return {
        ...existing,
        rate: rateData.rate,
        source: rateData.source || existing.source,
        createdBy: rateData.createdBy || existing.createdBy,
        updatedAt: now,
      };
    } else {
      // Insert new
      const rate = {
        rateId: rateData.rateId,
        rateDate: date,
        baseCurrency: rateData.baseCurrency || 'USD',
        quoteCurrency: rateData.quoteCurrency || 'VES',
        rate: rateData.rate,
        source: rateData.source || 'manual',
        createdBy: rateData.createdBy || null,
        createdAt: now,
        updatedAt: now,
      };

      await this.create(rate);
      return rate;
    }
  }
}

module.exports = MySQLFxRatesRepository;
