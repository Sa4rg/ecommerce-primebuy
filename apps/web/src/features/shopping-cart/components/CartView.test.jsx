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
            metadata: { market: "VE", baseCurrency: "USD" },
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
    expect(
      screen.getByText((content) => content.includes("Qty:") && content.includes("2"))
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("Subtotal:") && content.includes("20"))
    ).toBeInTheDocument();
  });
});
