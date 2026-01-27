/**
 * Payment Status Constants
 * 
 * Centralized payment status strings.
 * Payments flow through: pending → submitted → confirmed/rejected.
 */

const PaymentStatus = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
};

module.exports = { PaymentStatus };
