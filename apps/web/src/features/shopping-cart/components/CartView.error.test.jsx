import React from "react";
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/renderWithProviders.jsx";
import { CartView } from "./CartView";

describe("CartView error UX", () => {
  it("shows an error banner when status is error", () => {
    renderWithProviders(<CartView />, {
      route: "/cart",
      cartInitialState: {
        status: "error",
        error: "Cart not found",
        cart: {
          cartId: "cart-1",
          items: [],
          summary: { itemsCount: 0, subtotalUSD: 0 },
          metadata: { status: "active" },
        },
      },
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/cart not found/i)).toBeInTheDocument();
  });
});
