const crypto = require("crypto");
const { AppError } = require("../utils/errors");

const defaultCheckoutService = require("./checkout.service");

function createPaymentsService(deps = {}) {
  const checkoutService = deps.checkoutService || defaultCheckoutService;
  const paymentsStore = deps.paymentsStore || new Map();
  const idGenerator = deps.idGenerator || (() => crypto.randomUUID());

  const VALID_METHODS = ["zelle", "zinli", "pago_movil", "bank_transfer"];
  const USD_METHODS = ["zelle", "zinli"];
  const VES_METHODS = ["pago_movil", "bank_transfer"];

  function nextUpdatedAt(previousUpdatedAt) {
    const next = new Date().toISOString();
    if (next !== previousUpdatedAt) return next;

    return new Date(Date.parse(previousUpdatedAt) + 1).toISOString();
  }

  async function createPayment(checkoutId, method) {
    const checkout = await checkoutService.getCheckoutById(checkoutId);

    if (!VALID_METHODS.includes(method)) {
      throw new AppError("Invalid payment method", 400);
    }

    let currency;
    let amount;

    if (USD_METHODS.includes(method)) {
      currency = "USD";
      amount = checkout.totals.subtotalUSD;
    } else if (VES_METHODS.includes(method)) {
      if (checkout.totals.subtotalVES === null) {
        throw new AppError("Exchange rate required", 400);
      }
      currency = "VES";
      amount = checkout.totals.subtotalVES;
    }

    const now = new Date().toISOString();
    const paymentId = idGenerator();

    const payment = {
      paymentId,
      checkoutId,
      method,
      currency,
      amount,
      status: "pending",
      proof: null,
      createdAt: now,
      updatedAt: now,
    };

    paymentsStore.set(paymentId, payment);

    return payment;
  }

  async function submitPayment(paymentId, proof) {
    if (!paymentsStore.has(paymentId)) {
      throw new AppError("Payment not found", 404);
    }

    const payment = paymentsStore.get(paymentId);

    if (payment.status !== "pending") {
      throw new AppError("Payment is not pending", 409);
    }

    if (!proof || typeof proof.reference !== "string" || proof.reference.length === 0) {
      throw new AppError("Invalid payment proof", 400);
    }

    payment.proof = proof;
    payment.status = "submitted";
    payment.updatedAt = nextUpdatedAt(payment.updatedAt);

    return payment;
  }

  async function confirmPayment(paymentId, note) {
    const payment = paymentsStore.get(paymentId);

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    if (payment.status !== "submitted") {
      throw new AppError("Payment is not submitted", 409);
    }

    if (note !== undefined && note !== null) {
      if (typeof note !== "string" || note.trim().length === 0) {
        throw new AppError("Invalid payment review", 400);
      }
    }

    payment.status = "confirmed";
    payment.review = { note: note ? note.trim() : null };
    payment.updatedAt = nextUpdatedAt(payment.updatedAt);

    return payment;
  }

  async function rejectPayment(paymentId, reason) {
    const payment = paymentsStore.get(paymentId);

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    if (payment.status !== "submitted") {
      throw new AppError("Payment is not submitted", 409);
    }

    if (typeof reason !== "string" || reason.trim().length === 0) {
      throw new AppError("Invalid payment review", 400);
    }

    payment.status = "rejected";
    payment.review = { reason: reason.trim() };
    payment.updatedAt = nextUpdatedAt(payment.updatedAt);

    return payment;
  }

  async function getPaymentById(paymentId) {
    if (!paymentsStore.has(paymentId)) {
      throw new AppError("Payment not found", 404);
    }
    return paymentsStore.get(paymentId);
  }

  return { createPayment, submitPayment, confirmPayment, rejectPayment, getPaymentById };
}

const paymentsService = createPaymentsService();

module.exports = paymentsService;
module.exports.createPaymentsService = createPaymentsService;
