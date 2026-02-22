import React from "react";
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/renderWithProviders.jsx";
import { CartSummary } from "./CartSummary.jsx";

describe("CartSummary", () => {
  it("does not render Shipping row (shipping is handled at checkout)", () => {
    renderWithProviders(
      <CartSummary summary={{ subtotalUSD: 20 }} disabled={false} onCheckout={() => {}} />,
      { route: "/cart" }
    );

    // Should not show the previous shipping line
    expect(screen.queryByText(/shipping/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/free/i)).not.toBeInTheDocument();

    // Still shows subtotal and total (localized)
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
  });
});