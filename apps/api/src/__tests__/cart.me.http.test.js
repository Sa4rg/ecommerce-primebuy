/**
 * GET /api/cart/me - Tests
 * 
 * This endpoint returns the active cart for the authenticated user.
 * If no cart exists, creates a new one.
 * If guest cart exists, merges items into user's cart.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { registerAndLogin } from "../test_helpers/authHelper.js";
import { createCart, cartSecretHeader } from "../test_helpers/cartHelper.js";

const baseUrl = "/api/cart";

function adminToken() {
  return jwt.sign(
    { sub: "admin-test", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

// Helper to create a product
async function createProduct(name, price = 10, stock = 100) {
  const res = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${adminToken()}`)
    .send({ name, priceUSD: price, stock, category: "Test" });
  return res.body.data.id;
}

// Helper to add item to cart
async function addItemToCart(cartId, cartSecret, productId, quantity) {
  return request(app)
    .post(`${baseUrl}/${cartId}/items`)
    .set(cartSecretHeader(cartSecret))
    .send({ productId, quantity });
}

describe("GET /api/cart/me", () => {
  it("returns 401 if not authenticated", async () => {
    const res = await request(app)
      .get(`${baseUrl}/me`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("creates a new cart if user has no active cart", async () => {
    const token = await registerAndLogin(app, "newuser");

    const res = await request(app)
      .get(`${baseUrl}/me`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cart).toBeDefined();
    expect(res.body.data.cart.items).toEqual([]);
    expect(res.body.data.isNewCart).toBe(true);
  });

  it("returns existing cart if user already has one", async () => {
    const token = await registerAndLogin(app, "existinguser");

    // First call creates the cart
    await request(app)
      .get(`${baseUrl}/me`)
      .set("Authorization", `Bearer ${token}`);

    // Second call should return same cart
    const res = await request(app)
      .get(`${baseUrl}/me`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isNewCart).toBe(false);
  });

  it("merges guest cart items when X-Guest-Cart-Id header is provided", async () => {
    // Create a product first
    const productId = await createProduct("Merge Test Product", 25);

    // Create guest cart with items
    const guestCart = await createCart(app);
    await addItemToCart(guestCart.cartId, guestCart.cartSecret, productId, 2);

    // Create user and their cart
    const token = await registerAndLogin(app, "mergeuser");
    
    // First get to create user's cart
    await request(app)
      .get(`${baseUrl}/me`)
      .set("Authorization", `Bearer ${token}`);

    // Second get with guest cart headers should merge
    const res = await request(app)
      .get(`${baseUrl}/me`)
      .set("Authorization", `Bearer ${token}`)
      .set("X-Guest-Cart-Id", guestCart.cartId)
      .set(cartSecretHeader(guestCart.cartSecret));

    expect(res.status).toBe(200);
    expect(res.body.data.mergedFromGuestCart).toBe(true);
    expect(res.body.data.cart.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.cart.items.some(i => i.productId === productId)).toBe(true);
  });

  it("increases quantity when merging item that already exists", async () => {
    // Create a product first
    const productId = await createProduct("Quantity Merge Product", 10);

    // Create guest cart with productId qty 3
    const guestCart = await createCart(app);
    await addItemToCart(guestCart.cartId, guestCart.cartSecret, productId, 3);

    // Create user and their cart with productId qty 2
    const token = await registerAndLogin(app, "mergequantity");
    
    // Get to create user's cart
    const createRes = await request(app)
      .get(`${baseUrl}/me`)
      .set("Authorization", `Bearer ${token}`);
    
    const userCartId = createRes.body.data.cart.cartId;
    
    // Add same product to user's cart
    await request(app)
      .post(`${baseUrl}/${userCartId}/items`)
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 2 });

    // Merge guest cart
    const res = await request(app)
      .get(`${baseUrl}/me`)
      .set("Authorization", `Bearer ${token}`)
      .set("X-Guest-Cart-Id", guestCart.cartId)
      .set(cartSecretHeader(guestCart.cartSecret));

    expect(res.status).toBe(200);
    expect(res.body.data.mergedFromGuestCart).toBe(true);
    
    const mergedItem = res.body.data.cart.items.find(i => i.productId === productId);
    expect(mergedItem).toBeDefined();
    expect(mergedItem.quantity).toBe(5); // 2 + 3
  });

  it("does not merge if guest cart secret is wrong", async () => {
    // Create a product first
    const productId = await createProduct("Wrong Secret Product", 15);

    // Create guest cart with items
    const guestCart = await createCart(app);
    await addItemToCart(guestCart.cartId, guestCart.cartSecret, productId, 2);

    // Create user 
    const token = await registerAndLogin(app, "wrongsecret");
    
    const res = await request(app)
      .get(`${baseUrl}/me`)
      .set("Authorization", `Bearer ${token}`)
      .set("X-Guest-Cart-Id", guestCart.cartId)
      .set("X-Cart-Secret", "wrong-secret");

    expect(res.status).toBe(200);
    expect(res.body.data.mergedFromGuestCart).toBe(false);
    expect(res.body.data.cart.items).toEqual([]);
  });
});
