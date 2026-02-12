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

describe("DELETE /api/cart/:cartId/items/:productId", () => {
  test("should remove item from cart and return updated cart", async () => {
    // Arrange: create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

    // Arrange: create two products
    const createProductARes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Product A",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductARes.status).toBe(201);
    const productAId = createProductARes.body.data.id;

    const createProductBRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Product B",
        priceUSD: 20,
        stock: 5,
        category: "Test",
      });
    expect(createProductBRes.status).toBe(201);
    const productBId = createProductBRes.body.data.id;

    // Arrange: add both items
    const addARes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId: productAId, quantity: 2 });
    expect(addARes.status).toBe(200);

    const addBRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId: productBId, quantity: 1 });
    expect(addBRes.status).toBe(200);

    // Act: delete product A
    const deleteRes = await request(app)
      .delete(`/api/cart/${cartId}/items/${productAId}`)
      .set("X-Cart-Secret", cartSecret);

    // Assert
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(deleteRes.body.data).toEqual(
      expect.objectContaining({
        cartId,
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: productBId,
          }),
        ]),
        summary: {
          itemsCount: 1,
          subtotalUSD: 20,
        },
      })
    );
    expect(deleteRes.body.data.items).toHaveLength(1);

    // Explicitly assert the remaining item details
    expect(deleteRes.body.data.items[0]).toEqual(
      expect.objectContaining({
        productId: productBId,
        quantity: 1,
        unitPriceUSD: 20,
        lineTotalUSD: 20,
      })
    );

    // Assert that the removed productId is not in the items
    expect(deleteRes.body.data.items.some(item => item.productId === productAId)).toBe(false);
  });

  test("should return 404 when cart does not exist", async () => {
    // Arrange: create a product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Any Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // Act: delete from invalid cart
    const res = await request(app)
      .delete(`/api/cart/invalid-cart-id/items/${productId}`);

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart not found",
      })
    );
  });

  test("should return 404 when item is not in cart", async () => {
    // Arrange: create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

    // Arrange: create product but do not add to cart
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Not In Cart Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // Act: delete item not in cart
    const res = await request(app)
      .delete(`/api/cart/${cartId}/items/${productId}`)
      .set("X-Cart-Secret", cartSecret);

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Item not found in cart",
      })
    );
  });
});