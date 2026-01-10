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

module.exports = { createPayment, submitPayment };
