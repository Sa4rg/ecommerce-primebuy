import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("PUT /api/products/:id", () => {
  test("should return 200 and the updated product when input is valid", async () => {
    const createPayload = {
      name: "Base Product",
      priceUSD: 100,
      stock: 5,
      category: "Electronics",
    };

    const createResponse = await request(app)
      .post("/api/products")
      .send(createPayload);

    expect(createResponse.status).toBe(201);
    const createdId = createResponse.body.data.id;

    const updatePayload = {
      name: "Updated Product",
      priceUSD: 150,
      stock: 0,
      category: "Gaming",
    };

    const updateResponse = await request(app)
      .put(`/api/products/${createdId}`)
      .send(updatePayload);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(updateResponse.body.data).toEqual(
      expect.objectContaining({
        id: createdId,
        name: "Updated Product",
        priceUSD: 150,
        stock: 0,
        category: "Gaming",
        inStock: false,
      })
    );
  });

  test("should return 404 when product does not exist", async () => {
    const payload = {
      name: "Test Product",
      priceUSD: 100,
      stock: 10,
      category: "Test",
    };

    const response = await request(app)
      .put("/api/products/999")
      .send(payload);

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Product not found",
      })
    );
  });

  test("should return 400 when input is invalid", async () => {
    const createPayload = {
      name: "Valid Product",
      priceUSD: 200,
      stock: 10,
      category: "Valid",
    };

    const createResponse = await request(app)
      .post("/api/products")
      .send(createPayload);

    expect(createResponse.status).toBe(201);
    const createdId = createResponse.body.data.id;

    const invalidPayload = {
      name: "Invalid Product",
      priceUSD: 0,
      stock: 10,
      category: "Invalid",
    };

    const updateResponse = await request(app)
      .put(`/api/products/${createdId}`)
      .send(invalidPayload);

    expect(updateResponse.status).toBe(400);
    expect(updateResponse.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid product input",
      })
    );
  });
});