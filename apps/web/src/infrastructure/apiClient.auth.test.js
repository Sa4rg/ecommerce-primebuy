import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./apiClient";

// ⚠️ httpOnly Cookies Migration
// apiClient now relies on httpOnly cookies instead of Authorization headers
// Tokens are sent automatically with credentials: 'include'
describe("apiClient httpOnly cookies", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends credentials: 'include' with every request", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { ok: true } }),
    });

    await apiClient.get("/api/something");

    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.credentials).toBe("include");
  });

  it("does not add Authorization header automatically", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { ok: true } }),
    });

    await apiClient.get("/api/something");

    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
    expect(options.headers.authorization).toBeUndefined();
  });

  it("respects custom Authorization header if explicitly provided", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { ok: true } }),
    });

    // Edge case: si alguien necesita enviar un header custom
    await apiClient.get("/api/something", {
      headers: { Authorization: "Bearer manual-token" },
    });

    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer manual-token");
  });

  it("handles 401 by attempting refresh and retrying", async () => {
    let callCount = 0;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      callCount++;

      // First call to protected endpoint → 401
      if (callCount === 1) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ success: false, message: "Unauthorized" }),
        };
      }

      // Second call is refresh
      if (callCount === 2 && url.includes("/auth/refresh")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: {} }), // No accessToken needed
        };
      }

      // Third call is retry of original request
      if (callCount === 3) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { ok: true } }),
        };
      }

      throw new Error("Unexpected call");
    });

    const result = await apiClient.get("/api/protected");
    
    expect(result).toEqual({ ok: true });
    expect(callCount).toBe(3);
  });
});
