const { success } = require("../utils/response");
const checkoutService = require("../services/checkout.service");

async function createCheckout(req, res, next) {
  try {
    const { cartId } = req.body;

    const checkout = await checkoutService.createCheckout(cartId);

    res.status(200);
    success(res, checkout, "Checkout created successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = { createCheckout };
