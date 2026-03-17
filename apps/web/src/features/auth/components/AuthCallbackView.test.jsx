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

  it("calls /refresh once, stores accessToken and redirects to returnTo", async () => {
    // el sync del carrito es best-effort en el componente
    syncUserCartMock.mockResolvedValue({});

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { accessToken: "oauth-token" },
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

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("accessToken")).toBe("oauth-token");

    // ✅ Best-effort: si lo llama, perfecto, pero no debe romper el login si falla
    expect(syncUserCartMock.mock.calls.length).toBeLessThanOrEqual(1);
  });
});