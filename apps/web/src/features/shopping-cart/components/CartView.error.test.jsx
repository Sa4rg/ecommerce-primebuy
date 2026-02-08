import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartProvider } from "../../../context/CartContext.jsx";
import { CartView } from "./CartView";

describe("CartView error UX", () => {
  it("shows an error banner when status is error", () => {
    render(
      <CartProvider
        initialState={{
          status: "error",
          error: "Cart not found",
          cart: {
            cartId: "cart-1",
            items: [],
            summary: { itemsCount: 0, subtotalUSD: 0 },
          },
        }}
      >
        <CartView />
      </CartProvider>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/cart not found/i)).toBeInTheDocument();
  });
});
