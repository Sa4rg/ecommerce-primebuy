const { success } = require("../utils/response");
const { services } = require("../composition/root");
const paymentsService = services.paymentsService;

async function createPayment(req, res, next) {
  try {
    const { checkoutId, method, proofReference } = req.body;
    const userId = req.user?.userId;

    const payment = await paymentsService.createPayment(checkoutId, method, userId, proofReference);

    res.status(201);
    success(res, payment, "Payment created successfully");
  } catch (error) {
    return next(error);
  }
}

async function submitPayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const proof = req.body;

    const payment = await paymentsService.submitPayment(paymentId, proof);

    res.status(200);
    success(res, payment, "Payment submitted successfully");
  } catch (error) {
    return next(error);
  }
}

async function confirmPayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const { note } = req.body;

    const payment = await paymentsService.confirmPayment(paymentId, note);

    res.status(200);
    success(res, payment, "Payment confirmed successfully");
  } catch (error) {
    return next(error);
  }
}

async function rejectPayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await paymentsService.rejectPayment(paymentId, reason);

    res.status(200);
    success(res, payment, "Payment rejected successfully");
  } catch (error) {
    return next(error);
  }
}

async function getPayment(req, res, next) {
  try {
    const { paymentId } = req.params;

    const payment = await paymentsService.getPaymentById(paymentId);

    res.status(200);
    success(res, payment, "Payment retrieved successfully");
  } catch (error) {
    return next(error);
  }
}

async function listPayments(req, res, next) {
  try {
    const { status } = req.query;
    const filters = {};
    
    if (status) {
      filters.status = status;
    }

    const payments = await paymentsService.listPayments(filters);

    res.status(200);
    success(res, payments, "Payments retrieved successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = { createPayment, submitPayment, confirmPayment, rejectPayment, getPayment, listPayments };
