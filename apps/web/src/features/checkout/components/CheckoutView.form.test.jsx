import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../test/renderWithProviders.jsx";
import App from "../../../App.jsx";

describe("CheckoutView form (Stitch)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem("accessToken", "token-123");
  });

  it("renders customer + shipping form with existing data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          checkoutId: "checkout-1",
          cartId: "cart-1",
          status: "pending",
          items: [{ productId: "p-1", name: "Product 1", quantity: 1, lineTotalUSD: 10 }],
          totals: { subtotalUSD: 10, subtotalVES: null },
          paymentMethods: { usd: ["zelle"], ves: ["bank_transfer"] },
          customer: { name: "Sara", email: "sara@gmail.com", phone: "0414" },
          shipping: {
            method: "delivery",
            address: {
              line1: "Av 1",
              city: "Caracas",
              // estos pueden venir o no, no son esenciales para la UI Stitch mínima
              recipientName: "Sara",
              phone: "0414",
            },
          },
        },
      }),
    });

    renderWithProviders(<App />, { route: "/checkout/checkout-1" });

    // Wait for page to load
    expect(await screen.findByRole("heading", { name: /order summary/i })).toBeInTheDocument();

    // Customer fields (Stitch)
    expect(screen.getByLabelText(/^name$/i)).toHaveValue("Sara");
    expect(screen.getByLabelText(/^email$/i)).toHaveValue("sara@gmail.com");
    expect(screen.getByLabelText(/^phone$/i)).toHaveValue("0414");

    // Shipping fields (Stitch)
    expect(screen.getByLabelText(/^city$/i)).toHaveValue("Caracas");
    expect(screen.getByLabelText(/street address/i)).toHaveValue("Av 1");
  });

  // ✅ Save flow for Stitch: PATCH customer + PATCH shipping (delivery)
  it("saves customer + shipping and shows Saved", async () => {
    const user = userEvent.setup();

    vi.spyOn(globalThis, "fetch")
      // 1) GET checkout
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            checkoutId: "checkout-1",
            cartId: "cart-1",
            status: "pending",
            items: [],
            totals: { subtotalUSD: 10, subtotalVES: null },
            paymentMethods: { usd: ["zelle"], ves: ["bank_transfer"] },
            customer: { name: "", email: "", phone: "" },
            shipping: { method: "delivery", address: { line1: "", city: "" } },
          },
        }),
      })
      // 2) PATCH customer
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            checkoutId: "checkout-1",
            customer: { name: "Sara", email: "sara@gmail.com", phone: "0414" },
          },
        }),
      })
      // 3) PATCH shipping
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            checkoutId: "checkout-1",
            shipping: {
              method: "delivery",
              address: {
                line1: "Av 1",
                city: "Caracas",
                recipientName: "Sara",
                phone: "0414",
              },
            },
          },
        }),
      });

    renderWithProviders(<App />, { route: "/checkout/checkout-1" });

    expect(await screen.findByRole("heading", { name: /order summary/i })).toBeInTheDocument();

    // Fill customer
    await user.clear(screen.getByLabelText(/^name$/i));
    await user.type(screen.getByLabelText(/^name$/i), "Sara");

    await user.clear(screen.getByLabelText(/^email$/i));
    await user.type(screen.getByLabelText(/^email$/i), "sara@gmail.com");

    await user.clear(screen.getByLabelText(/^phone$/i));
    await user.type(screen.getByLabelText(/^phone$/i), "0414");

    // Fill shipping (Stitch)
    await user.clear(screen.getByLabelText(/^city$/i));
    await user.type(screen.getByLabelText(/^city$/i), "Caracas");

    await user.clear(screen.getByLabelText(/street address/i));
    await user.type(screen.getByLabelText(/street address/i), "Av 1");

    // Save
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });

    // Assert calls order
    const calls = globalThis.fetch.mock.calls.map((c) => c[0]);
    expect(calls[0]).toMatch(/\/api\/checkout\/checkout-1$/); // GET
    expect(calls[1]).toMatch(/\/api\/checkout\/checkout-1\/customer$/); // PATCH customer
    expect(calls[2]).toMatch(/\/api\/checkout\/checkout-1\/shipping$/); // PATCH shipping

    // Assert customer payload
    const [, optionsCustomer] = globalThis.fetch.mock.calls[1];
    expect(optionsCustomer.method).toBe("PATCH");
    expect(JSON.parse(optionsCustomer.body)).toMatchObject({
      name: "Sara",
      email: "sara@gmail.com",
      phone: "0414",
    });

    // Assert shipping payload (Stitch minimal)
    const [, optionsShipping] = globalThis.fetch.mock.calls[2];
    expect(optionsShipping.method).toBe("PATCH");
    expect(JSON.parse(optionsShipping.body)).toMatchObject({
      method: "delivery",
      address: {
        line1: "Av 1",
        city: "Caracas",
        // CheckoutView rellena recipientName/phone con customer si falta
        recipientName: "Sara",
        phone: "0414",
      },
    });
  });

  it("does not call PATCH when required fields are missing and shows error", async () => {
    const user = userEvent.setup();

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          checkoutId: "checkout-1",
          cartId: "cart-1",
          status: "pending",
          items: [],
          totals: { subtotalUSD: 10, subtotalVES: null },
          paymentMethods: { usd: ["zelle"], ves: ["bank_transfer"] },
          customer: { name: "", email: "", phone: "" },
          shipping: { method: "delivery", address: { line1: "", city: "" } },
        },
      }),
    });

    renderWithProviders(<App />, { route: "/checkout/checkout-1" });

    expect(await screen.findByRole("heading", { name: /order summary/i })).toBeInTheDocument();

    // Leave required fields incomplete (example: only city)
    await user.type(screen.getByLabelText(/^city$/i), "Caracas");

    await user.click(screen.getByRole("button", { name: /save/i }));

    // Must show local validation error
    expect(await screen.findByText(/please complete shipping address/i)).toBeInTheDocument();

    // Only GET should have happened
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
