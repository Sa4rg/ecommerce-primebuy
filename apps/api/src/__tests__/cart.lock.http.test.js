import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

/**
 * Helper to create a new cart
 * @returns {Promise<string>} cartId
 */
async function createCart() {
  const res = await request(app).post("/api/cart");
  expect(res.status).toBe(201);
  return res.body.data.cartId;
}

/**
 * Helper to create a product
 * @returns {Promise<string>} productId
 */
async function createProduct() {
  const res = await request(app).post("/api/products").send({
    name: "Lock Test Product",
    priceUSD: 10,
    stock: 5,
    category: "Test",
  });
  expect(res.status).toBe(201);
  return res.body.data.id;
}

/**
 * Helper to lock a cart
 * @param {string} cartId
 */
async function lockCart(cartId) {
  const res = await request(app)
    .patch(`/api/cart/${cartId}/metadata`)
    .send({ status: "locked" });
  expect(res.status).toBe(200);
}

/**
 * Helper to set cart status to checked_out
 * @param {string} cartId
 */
async function checkoutCart(cartId) {
  const res = await request(app)
    .patch(`/api/cart/${cartId}/metadata`)
    .send({ status: "checked_out" });
  expect(res.status).toBe(200);
}

describe("Cart lock enforcement", () => {
  test("POST items should return 409 when cart is locked", async () => {
    // Arrange
    const cartId = await createCart();
    const productId = await createProduct();
    await lockCart(cartId);

    // Act
    const res = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart is not active",
      })
    );
  });

  test("POST items should return 409 when cart is checked_out", async () => {
    // Arrange
    const cartId = await createCart();
    const productId = await createProduct();
    await checkoutCart(cartId);

    // Act
    const res = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart is not active",
      })
    );
  });

  test("PATCH item should return 409 when cart is locked", async () => {
    // Arrange
    const cartId = await createCart();
    const productId = await createProduct();

    // Add item while cart is active
    const addRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });
    expect(addRes.status).toBe(200);

    await lockCart(cartId);

    // Act
    const res = await request(app)
      .patch(`/api/cart/${cartId}/items/${productId}`)
      .send({ quantity: 2 });

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart is not active",
      })
    );
  });

  test("PATCH item should return 409 when cart is checked_out", async () => {
    // Arrange
    const cartId = await createCart();
    const productId = await createProduct();

    // Add item while cart is active
    const addRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });
    expect(addRes.status).toBe(200);

    await checkoutCart(cartId);

    // Act
    const res = await request(app)
      .patch(`/api/cart/${cartId}/items/${productId}`)
      .send({ quantity: 2 });

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart is not active",
      })
    );
  });

  test("DELETE item should return 409 when cart is locked", async () => {
    // Arrange
    const cartId = await createCart();
    const productId = await createProduct();

    // Add item while cart is active
    const addRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });
    expect(addRes.status).toBe(200);

    await lockCart(cartId);

    // Act
    const res = await request(app).delete(`/api/cart/${cartId}/items/${productId}`);

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart is not active",
      })
    );
  });

  test("DELETE item should return 409 when cart is checked_out", async () => {
    // Arrange
    const cartId = await createCart();
    const productId = await createProduct();

    // Add item while cart is active
    const addRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });
    expect(addRes.status).toBe(200);

    await checkoutCart(cartId);

    // Act
    const res = await request(app).delete(`/api/cart/${cartId}/items/${productId}`);

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart is not active",
      })
    );
  });
});
