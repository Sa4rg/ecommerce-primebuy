import React from "react";
import { describe, it, expect, } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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
  it("does not render badge when itemsCount is 0", () => {
    render(
      <CartProvider>
        <MemoryRouter>
          <CartIndicator />
        </MemoryRouter>
      </CartProvider>
    );

    // Cart link exists but no count badge
    expect(screen.getByRole("link", { name: /go to cart/i })).toBeInTheDocument();
    expect(screen.queryByText("0")).toBeNull();
  });

  it("renders itemsCount badge when itemsCount > 0", async () => {
    render(
      <CartProvider>
        <MemoryRouter>
          <TestSetup itemsCount={3} />
        </MemoryRouter>
      </CartProvider>
    );

    expect(await screen.findByText("3")).toBeInTheDocument();
  });
});
