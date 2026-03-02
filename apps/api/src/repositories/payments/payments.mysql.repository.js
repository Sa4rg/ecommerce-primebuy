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
const { isoToMySQLDatetime, mysqlDatetimeToISO } = require('../../utils/datetime');

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
      if (row.proof_url !== null) proof.proofUrl = row.proof_url;
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
      userId: row.user_id ? String(row.user_id) : null,
      checkoutId: String(row.checkout_id),
      method: row.method,
      currency: row.currency,
      amount: parseFloat(row.amount),
      status: row.status,
      proof,
      review,
      createdAt: mysqlDatetimeToISO(row.created_at),
      updatedAt: mysqlDatetimeToISO(row.updated_at),
    };
  }

  /**
   * Map payment object to DB format
   * @private
   */
  _mapToDbFormat(payment) {
    const dbData = {
      payment_id: payment.paymentId,
      user_id: payment.userId || null,
      checkout_id: payment.checkoutId,
      method: payment.method,
      currency: payment.currency,
      amount: payment.amount,
      status: payment.status,
      created_at: isoToMySQLDatetime(payment.createdAt),
      updated_at: isoToMySQLDatetime(payment.updatedAt),
    };
    
    // Map proof object to flat columns
    if (payment.proof !== null && payment.proof !== undefined) {
      dbData.proof_reference = payment.proof.reference;
      dbData.proof_date = payment.proof.date || null;
      dbData.proof_note = payment.proof.note || null;
      dbData.proof_url = payment.proof.proofUrl || null;
    } else {
      dbData.proof_reference = null;
      dbData.proof_date = null;
      dbData.proof_note = null;
      dbData.proof_url = null;
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

  async findByCheckoutId(checkoutId) {
    const rows = await db(this.table)
      .where({ checkout_id: checkoutId });
    
    return rows.map(row => this._mapToPayment(row));
  }

  /**
   * Finds all payments, optionally filtered by status.
   * @param {Object} filters - Optional filters { status: string }
   * @returns {Promise<Object[]>}
   */
  async findAll(filters = {}) {
    let query = db(this.table);
    
    if (filters.status) {
      query = query.where({ status: filters.status });
    }
    
    const rows = await query.orderBy('created_at', 'desc');
    return rows.map(row => this._mapToPayment(row));
  }

  /**
   * Finds all payments for a specific user
   * @param {string} userId
   * @returns {Promise<Object[]>}
   */
  async findByUserId(userId) {
    const rows = await db(this.table)
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
    return rows.map(row => this._mapToPayment(row));
  }

    /**
   * Decrement stock atomically (only if enough stock)
   * @param {string} id
   * @param {number} qty
   * @param {object} [trx] - knex transaction
   * @returns {Promise<boolean>} true if updated, false if insufficient
   */
  async decrementStock(id, qty, trx) {
    const numericId = parseInt(id, 10);
    const q = trx || db;

    const updatedRows = await q(this.table)
      .where({ id: numericId })
      .andWhere("stock", ">=", qty)
      .update({
        stock: db.raw("stock - ?", [qty]),
      });

    return updatedRows > 0;
  }

}



module.exports = { MySQLPaymentsRepository };
