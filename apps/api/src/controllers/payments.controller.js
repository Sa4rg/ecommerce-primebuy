const { success } = require("../utils/response");
const paymentsService = require("../services/payments.service");

async function createPayment(req, res, next) {
  try {
    const { checkoutId, method } = req.body;

    const payment = await paymentsService.createPayment(checkoutId, method);

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

module.exports = { createPayment, submitPayment, confirmPayment, rejectPayment };
