import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "../../../context/CartContext.jsx";
import { CartView } from "./CartView.jsx";

describe("CartView session expired", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows login and new cart options when session expired (401)", async () => {
    // Simula un carrito reclamado pero con sesión expirada
    const initialState = {
      cart: null,
      status: "session-expired",
      error: "Unauthorized",
    };

    render(
      <CartProvider initialState={initialState}>
        <MemoryRouter initialEntries={["/cart"]}>
          <Routes>
            <Route path="/cart" element={<CartView />} />
            <Route path="/login" element={<h1>Login Page</h1>} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );

    // Debe mostrar mensaje de sesión expirada
    expect(screen.getByRole("heading", { name: /session expired/i })).toBeInTheDocument();

    // Debe ofrecer opción de login
    expect(
      screen.getByRole("link", { name: /log in/i })
    ).toBeInTheDocument();

    // Debe ofrecer opción de continuar como invitado
    expect(
      screen.getByRole("button", { name: /continue as guest/i })
    ).toBeInTheDocument();
  });

  it("navigates to login when clicking Log in", async () => {
    const initialState = {
      cart: null,
      status: "session-expired",
      error: "Unauthorized",
    };

    render(
      <CartProvider initialState={initialState}>
        <MemoryRouter initialEntries={["/cart"]}>
          <Routes>
            <Route path="/cart" element={<CartView />} />
            <Route path="/login" element={<h1>Login Page</h1>} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: /log in/i }));

    expect(screen.getByRole("heading", { name: /login page/i })).toBeInTheDocument();
  });

  it("starts new anonymous cart when clicking Continue as guest", async () => {
    localStorage.setItem("cartId", "old-claimed-cart");
    localStorage.setItem("cartSecret", "old-secret");

    const initialState = {
      cart: null,
      status: "session-expired",
      error: "Unauthorized",
    };

    // Mock fetch for creating new cart
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (url.includes("/api/cart") && !url.includes("old-claimed-cart")) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                cartId: "new-anon-cart",
                cartSecret: "new-secret",
                items: [],
                summary: { itemsCount: 0, subtotalUSD: 0 },
                metadata: { status: "active" },
              },
            }),
        });
      }
      // GET new cart
      if (url.includes("new-anon-cart")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                cartId: "new-anon-cart",
                items: [],
                summary: { itemsCount: 0, subtotalUSD: 0 },
                metadata: { status: "active" },
              },
            }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch: " + url));
    });

    render(
      <CartProvider initialState={initialState}>
        <MemoryRouter initialEntries={["/cart"]}>
          <Routes>
            <Route path="/cart" element={<CartView />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /continue as guest/i }));

    // localStorage should be cleared (old cart) and new cart created
    // The component should now show empty cart
    expect(localStorage.getItem("cartId")).not.toBe("old-claimed-cart");
  });
});
