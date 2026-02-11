const { success } = require("../utils/response");
const { services } = require("../composition/root");
const checkoutService = services.checkoutService;

async function createCheckout(req, res, next) {
  try {
    const { cartId } = req.body;

    const userId = req.user?.userId;
    const checkout = await checkoutService.createCheckout(cartId, userId);


    res.status(200);
    success(res, checkout, "Checkout created successfully");
  } catch (error) {
    return next(error);
  }
}
  
async function getCheckoutById(req, res, next) {
  try {
    const { checkoutId } = req.params;
    const userId = req.user?.userId;
    const checkout = await checkoutService.getCheckoutById(checkoutId, userId);

    res.status(200);
    success(res, checkout, "Checkout retrieved successfully");
  } catch (error) {
    return next(error);
  }
}

async function updateShipping(req, res, next) {
  try {
    const { checkoutId } = req.params;
    const userId = req.user?.userId;
    const patch = req.body;

    const updated = await checkoutService.updateShipping(checkoutId, userId, patch);

    res.status(200);
    success(res, updated, "Shipping updated successfully");
  } catch (err) {
    next(err);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const { checkoutId } = req.params;
    const userId = req.user?.userId;

    const updated = await checkoutService.updateCustomer(checkoutId, userId, req.body);

    res.status(200);
    success(res, updated, "Customer updated successfully");
  } catch (error) {
    return next(error);
  }
}




module.exports = { createCheckout, getCheckoutById, updateShipping, updateCustomer };
