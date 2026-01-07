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
    res.status(200);
    success(res, cart, "Cart retrieved successfully");
  } catch (error) {
    return next(error);
  }
}

async function addItem(req, res, next) {
  try {
    const { cartId } = req.params;
    const { productId, quantity } = req.body;

    const cart = await cartService.addItem(cartId, productId, quantity);

    res.status(200);
    success(res, cart, "Item added to cart successfully");
  } catch (error) {
    return next(error);
  }
}

async function updateItem(req, res, next) {
  try {
    const { cartId, productId } = req.params;
    const { quantity } = req.body;

    const cart = await cartService.updateItem(cartId, productId, quantity);

    res.status(200);
    success(res, cart, "Item updated in cart successfully");
  } catch (error) {
    return next(error);
  }
}

async function removeItem(req, res, next) {
  try {
    const { cartId, productId } = req.params;

    const cart = await cartService.removeItem(cartId, productId);

    res.status(200);
    success(res, cart, "Item removed from cart");
  } catch (error) {
    return next(error);
  }
}

async function updateMetadata(req, res, next) {
  try {
    const { cartId } = req.params;
    const patch = req.body;

    const cart = await cartService.updateMetadata(cartId, patch);

    res.status(200);
    success(res, cart, "Cart metadata updated successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = { createCart, getCart, addItem, updateItem, removeItem, updateMetadata };
