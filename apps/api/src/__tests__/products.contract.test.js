const request = require("supertest");
const app = require("../app.js");

describe("GET /api/products - Contract Test", () => {
  test("should return correct contract", async () => {
    const response = await request(app).get("/api/products");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);

    response.body.data.forEach(product => {
      expect(typeof product.id).toBe('string');
      expect(typeof product.name).toBe('string');
      expect(typeof product.priceUSD).toBe('number');
      expect(typeof product.stock).toBe('number');
      expect(typeof product.category).toBe('string');
      expect(typeof product.inStock).toBe("boolean");

    });
  });
});