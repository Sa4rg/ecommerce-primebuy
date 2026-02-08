import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartIndicator } from "./CartIndicator";
import { CartProvider, useCart } from "../../context/CartContext.jsx";

function TestSetup({ itemsCount }) {
  const { setCart } = useCart();

  React.useEffect(() => {
    if (itemsCount > 0) {
      setCart({
        summary: { itemsCount },
      });
    }
  }, [itemsCount, setCart]);

  return <CartIndicator />;
}

describe("CartIndicator", () => {
  it("does not render when itemsCount is 0", () => {
    render(
      <CartProvider>
        <CartIndicator />
      </CartProvider>
    );

    expect(screen.queryByText(/cart/i)).toBeNull();
  });

  it("renders itemsCount when itemsCount > 0", async () => {
    render(
      <CartProvider>
        <TestSetup itemsCount={3} />
      </CartProvider>
    );

    expect(await screen.findByText("Cart (3)")).toBeInTheDocument();
  });
});
