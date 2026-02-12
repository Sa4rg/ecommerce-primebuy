import { describe, test, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";

function adminToken() {
  return jwt.sign(
    { sub: "admin-test", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

/**
 * Helper to create a new cart
 * @returns {Promise<{cartId: string, cartSecret: string}>}
 */
async function createCart() {
  const res = await request(app).post("/api/cart");
  expect(res.status).toBe(201);
  return {
    cartId: res.body.data.cartId,
    cartSecret: res.body.data.cartSecret,
  };
}

/**
 * Helper to create a product
 * @returns {Promise<string>} productId
 */
async function createProduct() {
  const res = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${adminToken()}`)
    .send({
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
 * @param {string} cartSecret
 */
async function lockCart(cartId, cartSecret) {
  const res = await request(app)
    .patch(`/api/cart/${cartId}/metadata`)
    .set("X-Cart-Secret", cartSecret)
    .send({ status: "locked" });
  expect(res.status).toBe(200);
}

/**
 * Helper to set cart status to checked_out
 * @param {string} cartId
 * @param {string} cartSecret
 */
async function checkoutCart(cartId, cartSecret) {
  const res = await request(app)
    .patch(`/api/cart/${cartId}/metadata`)
    .set("X-Cart-Secret", cartSecret)
    .send({ status: "checked_out" });
  expect(res.status).toBe(200);
}

describe("Cart lock enforcement", () => {
  test("POST items should return 409 when cart is locked", async () => {
    // Arrange
    const { cartId, cartSecret } = await createCart();
    const productId = await createProduct();
    await lockCart(cartId, cartSecret);

    // Act
    const res = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
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
    const { cartId, cartSecret } = await createCart();
    const productId = await createProduct();
    await checkoutCart(cartId, cartSecret);

    // Act
    const res = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
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
    const { cartId, cartSecret } = await createCart();
    const productId = await createProduct();

    // Add item while cart is active
    const addRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });
    expect(addRes.status).toBe(200);

    await lockCart(cartId, cartSecret);

    // Act
    const res = await request(app)
      .patch(`/api/cart/${cartId}/items/${productId}`)
      .set("X-Cart-Secret", cartSecret)
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
    const { cartId, cartSecret } = await createCart();
    const productId = await createProduct();

    // Add item while cart is active
    const addRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });
    expect(addRes.status).toBe(200);

    await checkoutCart(cartId, cartSecret);

    // Act
    const res = await request(app)
      .patch(`/api/cart/${cartId}/items/${productId}`)
      .set("X-Cart-Secret", cartSecret)
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
    const { cartId, cartSecret } = await createCart();
    const productId = await createProduct();

    // Add item while cart is active
    const addRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });
    expect(addRes.status).toBe(200);

    await lockCart(cartId, cartSecret);

    // Act
    const res = await request(app)
      .delete(`/api/cart/${cartId}/items/${productId}`)
      .set("X-Cart-Secret", cartSecret);

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
    const { cartId, cartSecret } = await createCart();
    const productId = await createProduct();

    // Add item while cart is active
    const addRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });
    expect(addRes.status).toBe(200);

    await checkoutCart(cartId, cartSecret);

    // Act
    const res = await request(app)
      .delete(`/api/cart/${cartId}/items/${productId}`)
      .set("X-Cart-Secret", cartSecret);

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
