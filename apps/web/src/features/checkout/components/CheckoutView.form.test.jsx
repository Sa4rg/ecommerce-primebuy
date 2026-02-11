import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../test/renderWithProviders.jsx";
import App from "../../../App.jsx";

describe("CheckoutView form", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem("accessToken", "token-123");
  });

  it("renders customer and shipping form with existing data", async () => {
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
              recipientName: "Sara",
              phone: "0414",
              state: "Caracas",
              city: "Caracas",
              line1: "Av 1",
              reference: "Cerca de...",
            },
          },
        },
      }),
    });

    renderWithProviders(<App />, { route: "/checkout/checkout-1" });

    expect(
      await screen.findByRole("heading", { name: /order summary/i })
    ).toBeInTheDocument();

    // Customer fields
    expect(screen.getByLabelText(/^name$/i)).toHaveValue("Sara");
    expect(screen.getByLabelText(/^email$/i)).toHaveValue("sara@gmail.com");
    expect(screen.getByLabelText(/^phone$/i)).toHaveValue("0414");

    // Shipping fields
    expect(screen.getByLabelText(/state/i)).toHaveValue("Caracas");
    expect(screen.getByLabelText(/city/i)).toHaveValue("Caracas");
  });

  // ✅ C4.4.3
  it("saves customer and shipping (full payload) and updates UI", async () => {
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
            shipping: {
              method: "delivery",
              address: {
                recipientName: "",
                phone: "",
                state: "",
                city: "",
                line1: "",
                reference: "",
              },
            },
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
                recipientName: "Sara",
                phone: "0414",
                state: "Caracas",
                city: "Caracas",
                line1: "Av 1",
                reference: "Cerca de...",
              },
            },
          },
        }),
      });

    renderWithProviders(<App />, { route: "/checkout/checkout-1" });

    // Wait load
    expect(
      await screen.findByRole("heading", { name: /order summary/i })
    ).toBeInTheDocument();

    // Fill customer (clear first)
    await user.clear(screen.getByLabelText(/^name$/i));
    await user.type(screen.getByLabelText(/^name$/i), "Sara");

    await user.clear(screen.getByLabelText(/^email$/i));
    await user.type(screen.getByLabelText(/^email$/i), "sara@gmail.com");

    await user.clear(screen.getByLabelText(/^phone$/i));
    await user.type(screen.getByLabelText(/^phone$/i), "0414");

    // Fill shipping FULL payload
    await user.clear(screen.getByLabelText(/recipient name/i));
    await user.type(screen.getByLabelText(/recipient name/i), "Sara");

    await user.clear(screen.getByLabelText(/recipient phone/i));
    await user.type(screen.getByLabelText(/recipient phone/i), "0414");

    await user.clear(screen.getByLabelText(/state/i));
    await user.type(screen.getByLabelText(/state/i), "Caracas");

    await user.clear(screen.getByLabelText(/city/i));
    await user.type(screen.getByLabelText(/city/i), "Caracas");

    await user.clear(screen.getByLabelText(/address line 1/i));
    await user.type(screen.getByLabelText(/address line 1/i), "Av 1");

    await user.clear(screen.getByLabelText(/reference/i));
    await user.type(screen.getByLabelText(/reference/i), "Cerca de...");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });

    // Assert calls order
    const calls = globalThis.fetch.mock.calls.map((c) => c[0]);
    expect(calls[0]).toMatch(/\/api\/checkout\/checkout-1$/); // GET
    expect(calls[1]).toMatch(/\/api\/checkout\/checkout-1\/customer$/); // PATCH customer
    expect(calls[2]).toMatch(/\/api\/checkout\/checkout-1\/shipping$/); // PATCH shipping

    // Assert payloads
    const [, optionsCustomer] = globalThis.fetch.mock.calls[1];
    expect(optionsCustomer.method).toBe("PATCH");
    expect(JSON.parse(optionsCustomer.body)).toMatchObject({
      name: "Sara",
      email: "sara@gmail.com",
      phone: "0414",
    });

    const [, optionsShipping] = globalThis.fetch.mock.calls[2];
    expect(optionsShipping.method).toBe("PATCH");
    expect(JSON.parse(optionsShipping.body)).toMatchObject({
      method: "delivery",
      address: {
        recipientName: "Sara",
        phone: "0414",
        state: "Caracas",
        city: "Caracas",
        line1: "Av 1",
        reference: "Cerca de...",
      },
    });
  });

  // ✅ C4.4.4
  it("does not call PATCH shipping when delivery address is incomplete and shows an error", async () => {
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
          shipping: {
            method: "delivery",
            address: {
              recipientName: "",
              phone: "",
              state: "",
              city: "",
              line1: "",
              reference: "",
            },
          },
        },
      }),
    });

    renderWithProviders(<App />, { route: "/checkout/checkout-1" });

    expect(
      await screen.findByRole("heading", { name: /order summary/i })
    ).toBeInTheDocument();

    // Fill only state/city (still incomplete)
    await user.type(screen.getByLabelText(/state/i), "Caracas");
    await user.type(screen.getByLabelText(/city/i), "Caracas");

    await user.click(screen.getByRole("button", { name: /save/i }));

    // Must show local validation error
    expect(
      await screen.findByText(/please complete shipping address/i)
    ).toBeInTheDocument();

    // Only GET should have happened
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("allows pickup shipping without address and calls PATCH shipping", async () => {
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
          shipping: {
            method: "delivery",
            address: { recipientName: "", phone: "", state: "", city: "", line1: "", reference: "" },
          },
        },
      }),
    })
    // 2) PATCH customer
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { checkoutId: "checkout-1", customer: { name: "Sara", email: "sara@gmail.com", phone: "0414" } },
      }),
    })
    // 3) PATCH shipping (pickup)
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { checkoutId: "checkout-1", shipping: { method: "pickup", address: null } },
      }),
    });

  renderWithProviders(<App />, { route: "/checkout/checkout-1" });

  expect(await screen.findByRole("heading", { name: /order summary/i })).toBeInTheDocument();

  // Fill customer
  await user.type(screen.getByLabelText(/^name$/i), "Sara");
  await user.type(screen.getByLabelText(/^email$/i), "sara@gmail.com");
  await user.type(screen.getByLabelText(/^phone$/i), "0414");

  // Switch to pickup
  await user.selectOptions(screen.getByLabelText(/method/i), "pickup");

  await user.click(screen.getByRole("button", { name: /save/i }));

  await waitFor(() => {
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });

  // Verify PATCH shipping payload
  const [, optionsShipping] = globalThis.fetch.mock.calls[2];
  expect(optionsShipping.method).toBe("PATCH");
  expect(JSON.parse(optionsShipping.body)).toMatchObject({ method: "pickup" });
});

});
