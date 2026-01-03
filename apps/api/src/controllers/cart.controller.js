const { success, fail } = require('../utils/response');
const cartService = require('../services/cart.service');

async function createCart(req, res, next) {
  try {
    const result = await cartService.createCart();
    res.status(201);
    success(res, result, "Cart created successfully");
  } catch (error) {
    return next(error);
  }
}

async function getCart(req, res, next) {
  try {
    const { cartId } = req.params;
    const cart = await cartService.getCart(cartId);
    success(res, cart, "Cart retrieved successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = { createCart, getCart };