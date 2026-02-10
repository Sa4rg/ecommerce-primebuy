import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./apiClient";

// Truco: como apiClient usa API_BASE_URL desde config,
// estos tests solo verifican headers, no el URL exacto.
describe("apiClient auth header", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("adds Authorization header when accessToken exists", async () => {
    localStorage.setItem("accessToken", "token-123");

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { ok: true } }),
    });

    await apiClient.get("/api/something");

    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer token-123");
  });

  it("does not add Authorization header when accessToken is missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { ok: true } }),
    });

    await apiClient.get("/api/something");

    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("respects custom Authorization header if provided", async () => {
    localStorage.setItem("accessToken", "token-123");

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { ok: true } }),
    });

    // Forzamos otro token manualmente
    await apiClient.get("/api/something", {
      headers: { Authorization: "Bearer manual-token" },
    });

    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer manual-token");
  });
});
