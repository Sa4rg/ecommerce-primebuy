const request = require("supertest");
const app = require("../app.js");

describe("GET /api/products", () => {
  test("should return status 200, success true, and data as array", async () => {
    const response = await request(app).get("/api/products");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});