import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { CartView } from "./CartView.jsx";
import { renderWithProviders } from "../../../test/renderWithProviders.jsx";

describe("CartView", () => {
  it("renders cart items and summary", () => {
    renderWithProviders(<CartView />, {
      route: "/cart",
      cartInitialState: {
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
      },
    });

    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /carrito de compras|shopping cart/i })).toBeInTheDocument();
    expect(screen.getAllByText(/\$20\.00/).length).toBeGreaterThan(0);
  });
});
