import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import jwt from "jsonwebtoken";

function adminToken() {
  return jwt.sign(
    { sub: "admin-test", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

describe("DELETE /api/products/:id", () => {
  test("should return 200 and the deleted product when it exists", async () => {
    const createPayload = {
      name: "Delete Me",
      priceUSD: 50,
      stock: 3,
      category: "Test",
    };

    const createResponse = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`) 
      .send(createPayload);

    expect(createResponse.status).toBe(201);

    const createdId = createResponse.body.data.id;
    expect(createdId).toBeDefined();  // ✅ Improvement: clearer failure if id is missing

    const deleteResponse = await request(app)
      .delete(`/api/products/${createdId}`)
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(deleteResponse.body.data).toEqual(
      expect.objectContaining({
        id: createdId,
        name: "Delete Me",
        priceUSD: 50,
        stock: 3,
        category: "Test",
        inStock: true,
      })
    );

    // Verify it's really deleted
    const getResponse = await request(app).get(`/api/products/${createdId}`);
    expect(getResponse.status).toBe(404);
    expect(getResponse.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Product not found",
      })
    );
  });

  test("should return 404 when product does not exist", async () => {
    const response = await request(app)
      .delete("/api/products/999")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Product not found",
      })
    );
  });
});