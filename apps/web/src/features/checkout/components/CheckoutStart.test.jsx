import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "../../../context/CartContext.jsx";
import { LanguageProvider } from "../../../shared/i18n/LanguageContext.jsx";
import { CheckoutStart } from "./CheckoutStart.jsx";

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("CheckoutStart", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
    localStorage.setItem("accessToken", "token-123");
    localStorage.setItem("cartId", "cart-1");
  });

  it("calls POST /api/checkout and redirects to checkout view on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: "Checkout created successfully",
        data: {
          checkoutId: "checkout-1",
          cartId: "cart-1",
          totals: { subtotalUSD: 20, subtotalVES: null },
          exchangeRate: null,
        },
      }),
    });

    render(
      <LanguageProvider>
        <CartProvider
          initialState={{
            status: "ready",
            cart: {
              cartId: "cart-1",
              items: [{ productId: "p-1", name: "Product A", quantity: 2, lineTotalUSD: 20 }],
              summary: { itemsCount: 2, subtotalUSD: 20 },
              metadata: { market: "VE", baseCurrency: "USD" },
            },
            error: "",
          }}
        >
          <MemoryRouter initialEntries={["/checkout"]}>
            <Routes>
              <Route path="/checkout" element={<CheckoutStart />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    const [url, options] = globalThis.fetch.mock.calls[0];

    expect(url).toContain("/api/checkout");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer token-123");
    expect(JSON.parse(options.body)).toEqual({ cartId: "cart-1" });

    // Verify navigation to checkout view
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/checkout/checkout-1", { replace: true });
    });
  });

  it("shows error message when backend returns 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        message: "Unauthorized",
      }),
    });

    render(
      <LanguageProvider>
        <CartProvider
          initialState={{
            status: "ready",
            cart: {
              cartId: "cart-1",
              items: [{ productId: "p-1", name: "Product A", quantity: 1, lineTotalUSD: 10 }],
              summary: { itemsCount: 1, subtotalUSD: 10 },
              metadata: { market: "VE", baseCurrency: "USD" },
            },
            error: "",
          }}
        >
          <MemoryRouter initialEntries={["/checkout"]}>
            <Routes>
              <Route path="/checkout" element={<CheckoutStart />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </LanguageProvider>
    );

    // Now shows friendly auth-required message instead of raw "Unauthorized"
    expect(await screen.findByText(/iniciar sesión para proceder al checkout/i)).toBeInTheDocument();
  });
});
