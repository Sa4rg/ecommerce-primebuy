import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../../test/renderWithProviders.jsx";
import { CartView } from "./CartView.jsx";

describe("CartView session expired", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows login and new cart options when session expired (401)", async () => {
    const initialState = {
      cart: null,
      status: "session-expired",
      error: "Unauthorized",
    };

    renderWithProviders(
      <Routes>
        <Route path="/cart" element={<CartView />} />
        <Route path="/login" element={<h1>Login Page</h1>} />
      </Routes>,
      { route: "/cart", cartInitialState: initialState }
    );

    expect(screen.getByRole("heading", { name: /sesión expirada|session expired/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ingresar|log in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continuar como invitado|continue as guest/i })).toBeInTheDocument();
  });

  it("navigates to login when clicking Log in", async () => {
    const initialState = {
      cart: null,
      status: "session-expired",
      error: "Unauthorized",
    };

    renderWithProviders(
      <Routes>
        <Route path="/cart" element={<CartView />} />
        <Route path="/login" element={<h1>Login Page</h1>} />
      </Routes>,
      { route: "/cart", cartInitialState: initialState }
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: /ingresar|log in/i }));

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

    renderWithProviders(
      <Routes>
        <Route path="/cart" element={<CartView />} />
      </Routes>,
      { route: "/cart", cartInitialState: initialState }
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /continuar como invitado|continue as guest/i }));

    expect(localStorage.getItem("cartId")).not.toBe("old-claimed-cart");
  });
});
