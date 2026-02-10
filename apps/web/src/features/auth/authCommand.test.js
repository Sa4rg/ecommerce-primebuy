import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, logout } from "./authCommand";
import { getAccessToken } from "./authStorage";

describe("authCommand", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("stores accessToken after login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: "Login successful",
        data: { accessToken: "token-abc" },
      }),
    });

    await login({ email: "a@a.com", password: "pass" });

    expect(getAccessToken()).toBe("token-abc");
  });

  it("logout clears accessToken", () => {
    localStorage.setItem("accessToken", "token-xyz");
    logout();
    expect(getAccessToken()).toBe("");
  });
});
