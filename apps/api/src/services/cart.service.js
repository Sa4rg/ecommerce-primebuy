const crypto = require('crypto');
const { AppError } = require('../utils/errors');

const carts = new Map();

function generateCartId() {
  return crypto.randomUUID();
}

async function createCart() {
  const cartId = generateCartId();
  const cart = {
    cartId,
    items: [],
    summary: { itemsCount: 0, subtotalUSD: 0 }
  };
  carts.set(cartId, cart);
  return { cartId };
}

async function getCart(cartId) {
  if (!carts.has(cartId)) {
    throw new AppError("Cart not found", 404);
  }
  return carts.get(cartId);
}

module.exports = { createCart, getCart };