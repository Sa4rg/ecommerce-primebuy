import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CartProvider } from "../../../context/CartContext.jsx";
import { CartView } from "./CartView.jsx";

describe("CartView", () => {
  it("renders cart items and summary", () => {
    render(
      <CartProvider
        initialState={{
          status: "ready",
          cart: {
            cartId: "cart-1",
            items: [
              {
                productId: "p-1",
                name: "Product 1",
                quantity: 2,
                lineTotalUSD: 20,
              },
            ],
            summary: { itemsCount: 2, subtotalUSD: 20 },
            metadata: { market: "VE", baseCurrency: "USD", status: "active" },
          },
          error: "",
        }}
      >
        <MemoryRouter initialEntries={["/cart"]}>
          <CartView />
        </MemoryRouter>
      </CartProvider>
    );

    expect(screen.getByText("Product 1")).toBeInTheDocument();
    // Heading shows "Shopping Cart"
    expect(screen.getByRole("heading", { name: /shopping cart/i })).toBeInTheDocument();
    // Price values exist (there may be multiple $20.00)
    expect(screen.getAllByText(/\$20\.00/).length).toBeGreaterThan(0);
  });
});
