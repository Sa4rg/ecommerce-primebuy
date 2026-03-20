import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthCallbackView } from "./AuthCallbackView";
import { LanguageProvider } from "../../../shared/i18n/LanguageContext.jsx";

const syncUserCartMock = vi.fn();

vi.mock("../../../context/CartContext.jsx", () => ({
  useCart: () => ({
    syncUserCart: syncUserCartMock,
  }),
}));

describe("AuthCallbackView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    syncUserCartMock.mockReset();
    localStorage.clear();
    
    // Mock window.location.replace
    delete window.location;
    window.location = { replace: vi.fn() };
  });

  it("calls /api/me to verify auth and redirects to returnTo", async () => {
    // el sync del carrito es best-effort en el componente
    syncUserCartMock.mockResolvedValue({});

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { id: 1, email: "user@test.com", role: "customer" }, // /api/me response
      }),
    });

    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={["/auth/callback?returnTo=%2Fcheckout"]}>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackView />} />
            <Route path="/checkout" element={<h2>Checkout</h2>} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(window.location.replace).toHaveBeenCalledWith("/checkout");
    });

    // ✅ httpOnly cookies: No accessToken in localStorage
    expect(localStorage.getItem("accessToken")).toBeNull();

    // ✅ Verifies authentication via /api/me
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/me"),
      expect.objectContaining({
        credentials: "include",
      })
    );

    // ✅ Best-effort: si lo llama, perfecto, pero no debe romper el login si falla
    expect(syncUserCartMock.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it("sanitizes malicious returnTo (https://evil.com) to /account", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { id: 1, email: "user@test.com" },
      }),
    });

    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={["/auth/callback?returnTo=https%3A%2F%2Fevil.com%2Fsteal"]}> 
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackView />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(window.location.replace).toHaveBeenCalledWith("/account");
    });
  });

  it("sanitizes non-whitelisted returnTo (/admin) to /account", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { id: 1, email: "user@test.com" },
      }),
    });

    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={["/auth/callback?returnTo=%2Fadmin%2Fusers"]}>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackView />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(window.location.replace).toHaveBeenCalledWith("/account");
    });
  });

  it("allows legitimate whitelisted returnTo (/products?q=camera)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { id: 1, email: "user@test.com" },
      }),
    });

    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={["/auth/callback?returnTo=%2Fproducts%3Fq%3Dcamera"]}>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackView />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(window.location.replace).toHaveBeenCalledWith("/products?q=camera");
    });
  });
});