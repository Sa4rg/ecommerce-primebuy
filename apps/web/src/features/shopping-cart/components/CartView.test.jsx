import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartView } from "./CartView";
import { CartProvider, useCart } from "../../../context/CartContext.jsx";

function TestSetup() {
  const { setCart } = useCart();

  React.useEffect(() => {
    setCart({
      cartId: "cart-1",
      items: [
        {
          productId: "p-1",
          name: "Product 1",
          quantity: 2,
          lineTotalUSD: 20,
        },
      ],
      summary: {
        itemsCount: 2,
        subtotalUSD: 20,
      },
    });
  }, [setCart]);

  return <CartView />;
}

describe("CartView", () => {
  it("renders cart items and summary", async () => {
    render(
      <CartProvider>
        <TestSetup />
      </CartProvider>
    );

    expect(await screen.findByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Qty: 2")).toBeInTheDocument();
    expect(screen.getByText("Subtotal: $20")).toBeInTheDocument();
  });
});
