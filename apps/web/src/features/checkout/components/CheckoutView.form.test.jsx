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
            shipping: { method: "delivery", address: { line1: "", city: "" , state: "", recipientName: "", phone: ""} },
          },
        }),
      })
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
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            checkoutId: "checkout-1",
            shipping: {
              method: "delivery",
              address: { line1: "Av 1", city: "Caracas", state: "Distrito Capital", recipientName: "Sara", phone: "0414" },
            },
          },
        }),
      });

    renderWithProviders(<App />, { route: "/checkout/checkout-1" });

    expect(await screen.findByRole("heading", { name: /order summary/i })).toBeInTheDocument();

    // Fill customer
    const name = screen.getByLabelText(/^name$/i);
    const email = screen.getByLabelText(/^email$/i);
    const phone = screen.getByLabelText(/^phone$/i);

    await user.clear(name);
    await user.type(name, "Sara");

    await user.clear(email);
    await user.type(email, "sara@gmail.com");

    await user.clear(phone);
    await user.type(phone, "0414");

    // Fill shipping
    const city = screen.getByLabelText(/^city$/i);
    const street = screen.getByLabelText(/street address/i);
    const state = screen.getByLabelText(/^state$/i);

    await user.clear(city);
    await user.type(city, "Caracas");

    await user.clear(street);
    await user.type(street, "Av 1");

    await user.clear(state);
    await user.type(state, "Distrito Capital");

    // ✅ Ensure DOM has the values (not optional)
    expect(name).toHaveValue("Sara");
    expect(email).toHaveValue("sara@gmail.com");
    expect(phone).toHaveValue("0414");
    expect(city).toHaveValue("Caracas");
    expect(street).toHaveValue("Av 1");
    expect(state).toHaveValue("Distrito Capital");

    // Save
    await user.click(screen.getByRole("button", { name: /save/i }));

    // ✅ If validation failed, you'll see this alert and ONLY 1 fetch call (GET)
    const maybeAlert = screen.queryByRole("alert");
    if (maybeAlert) {
      // This will make the failure message obvious:
      expect(maybeAlert).not.toHaveTextContent(/please complete shipping address/i);
    }

    // ✅ Now wait for PATCH calls
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3));

    // Saved
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
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
          shipping: { method: "delivery", address: { line1: "", city: "", state: "", recipientName: "", phone: "" } },
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
