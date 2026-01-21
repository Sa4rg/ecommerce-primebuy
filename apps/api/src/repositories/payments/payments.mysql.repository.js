/**
 * MySQLPaymentsRepository
 * 
 * MySQL implementation of PaymentsRepository contract.
 * Uses Knex for database operations.
 * 
 * Contract:
 * - create(payment) -> returns { paymentId }
 * - findById(paymentId) -> returns payment object or null
 * - save(payment) -> void
 * 
 * Rules:
 * - IDs remain strings (input and output)
 * - No business validation (persistence only)
 * - No timestamp generation (comes from domain)
 */

const db = require('../../db/knex');

class MySQLPaymentsRepository {
  constructor() {
    this.table = 'payments';
  }

  /**
   * Map DB row to payment object
   * @private
   */
  _mapToPayment(row) {
    if (!row) return null;
    
    // Map proof: null if proof_reference is null, otherwise object with present fields
    let proof = null;
    if (row.proof_reference !== null) {
      proof = {
        reference: row.proof_reference,
      };
      if (row.proof_date !== null) proof.date = row.proof_date;
      if (row.proof_note !== null) proof.note = row.proof_note;
    }
    
    // Map review: undefined if both fields are null, otherwise object with present fields
    let review = undefined;
    if (row.review_note !== null || row.review_reason !== null) {
      review = {};
      if (row.review_note !== null) review.note = row.review_note;
      if (row.review_reason !== null) review.reason = row.review_reason;
    }
    
    return {
      paymentId: String(row.payment_id),
      checkoutId: String(row.checkout_id),
      method: row.method,
      currency: row.currency,
      amount: parseFloat(row.amount),
      status: row.status,
      proof,
      review,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }

  /**
   * Map payment object to DB format
   * @private
   */
  _mapToDbFormat(payment) {
    const dbData = {
      payment_id: payment.paymentId,
      checkout_id: payment.checkoutId,
      method: payment.method,
      currency: payment.currency,
      amount: payment.amount,
      status: payment.status,
      created_at: payment.createdAt,
      updated_at: payment.updatedAt,
    };
    
    // Map proof object to flat columns
    if (payment.proof !== null && payment.proof !== undefined) {
      dbData.proof_reference = payment.proof.reference;
      dbData.proof_date = payment.proof.date || null;
      dbData.proof_note = payment.proof.note || null;
    } else {
      dbData.proof_reference = null;
      dbData.proof_date = null;
      dbData.proof_note = null;
    }
    
    // Map review object to flat columns
    if (payment.review !== undefined && payment.review !== null) {
      dbData.review_note = payment.review.note || null;
      dbData.review_reason = payment.review.reason || null;
    } else {
      dbData.review_note = null;
      dbData.review_reason = null;
    }
    
    return dbData;
  }

  /**
   * Persists a new payment
   * @param {Object} payment
   * @returns {Promise<{paymentId: string}>}
   */
  async create(payment) {
    const dbData = this._mapToDbFormat(payment);
    await db(this.table).insert(dbData);
    return { paymentId: payment.paymentId };
  }

  /**
   * Finds payment by ID
   * @param {string} paymentId
   * @returns {Promise<Object|null>}
   */
  async findById(paymentId) {
    const row = await db(this.table)
      .where({ payment_id: paymentId })
      .first();
    
    return this._mapToPayment(row);
  }

  /**
   * Overwrites existing payment
   * @param {Object} payment
   * @returns {Promise<void>}
   */
  async save(payment) {
    const dbData = this._mapToDbFormat(payment);
    
    await db(this.table)
      .where({ payment_id: payment.paymentId })
      .update(dbData);
  }
}

module.exports = { MySQLPaymentsRepository };
