/**
 * FxRates Repository Factory
 * 
 * Selects the appropriate FxRatesRepository implementation based on environment.
 * 
 * Strategy:
 * - If DB_INTEGRATION=1 (set by test:db script): Use MySQLFxRatesRepository
 * - Otherwise: Use InMemoryFxRatesRepository (unit tests, development)
 */

const MySQLFxRatesRepository = require('../../repositories/fx_rates/fx_rates.mysql.repository');
const { shouldUseMySQL } = require('./repository.provider');

/**
 * In-memory implementation for unit tests
 */
class InMemoryFxRatesRepository {
  constructor() {
    this.rates = new Map(); // key: "date|base|quote" -> rate object
  }

  async create(rate) {
    const key = `${rate.rateDate}|${rate.baseCurrency}|${rate.quoteCurrency}`;
    this.rates.set(key, { ...rate });
    return { rateId: rate.rateId };
  }

  async findByDate(date, base = 'USD', quote = 'VES') {
    const key = `${date}|${base}|${quote}`;
    const rate = this.rates.get(key);
    return rate ? { ...rate } : null;
  }

  async findLatest(base = 'USD', quote = 'VES') {
    let latest = null;
    for (const rate of this.rates.values()) {
      if (rate.baseCurrency === base && rate.quoteCurrency === quote) {
        if (!latest || rate.rateDate > latest.rateDate) {
          latest = rate;
        }
      }
    }
    return latest ? { ...latest } : null;
  }

  async upsertForDate(date, rateData) {
    const key = `${date}|${rateData.baseCurrency || 'USD'}|${rateData.quoteCurrency || 'VES'}`;
    const existing = this.rates.get(key);
    const now = new Date().toISOString();

    if (existing) {
      const updated = {
        ...existing,
        rate: rateData.rate,
        source: rateData.source || existing.source,
        createdBy: rateData.createdBy || existing.createdBy,
        updatedAt: now,
      };
      this.rates.set(key, updated);
      return updated;
    } else {
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
      this.rates.set(key, rate);
      return rate;
    }
  }

  // Testing helper
  clear() {
    this.rates.clear();
  }
}

/**
 * Create repository based on environment
 */
function createFxRatesRepository() {
  if (shouldUseMySQL()) {
    return new MySQLFxRatesRepository();
  }
  return new InMemoryFxRatesRepository();
}

module.exports = {
  createFxRatesRepository,
  InMemoryFxRatesRepository,
};
