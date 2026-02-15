import { describe, it, expect, vi, beforeEach } from "vitest";
import { login } from "./authCommand";

describe("authCommand", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns accessToken from backend on successful login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: "Login successful",
        data: { accessToken: "token-abc" },
      }),
    });

    const result = await login({ email: "a@a.com", password: "pass" });

    // login() returns the data from API (token storage is handled by AuthContext)
    expect(result.accessToken).toBe("token-abc");
  });

  it("throws error when email or password is missing", async () => {
    await expect(login({ email: "", password: "pass" })).rejects.toThrow("email and password are required");
    await expect(login({ email: "a@a.com", password: "" })).rejects.toThrow("email and password are required");
  });
});
