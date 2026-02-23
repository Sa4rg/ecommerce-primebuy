import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthCallbackView } from "./AuthCallbackView";

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
  });

  it("calls /refresh once and redirects to returnTo", async () => {
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
      <MemoryRouter initialEntries={["/auth/callback?returnTo=%2Fcheckout"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackView />} />
          <Route path="/checkout" element={<h2>Checkout</h2>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /checkout/i })).toBeInTheDocument();
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(syncUserCartMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("accessToken")).toBe("oauth-token");
  });
});
