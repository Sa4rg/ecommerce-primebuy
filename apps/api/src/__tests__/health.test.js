const request = require("supertest");
const app = require("../app.js");

describe("GET /health", () => {
  test("should return status 200 and { status: \"ok\" }", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", uptimeSeconds: expect.any(Number) });
  });
});