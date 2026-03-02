import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../../test/renderWithProviders.jsx";
import { CheckoutView } from "../CheckoutView.jsx";
import { updateCheckoutCustomer, updateCheckoutShipping } from "../checkoutCommand";
import { paymentService } from "../../payment/paymentService";

vi.mock("../checkoutCommand", () => ({
  updateCheckoutCustomer: vi.fn(),
  updateCheckoutShipping: vi.fn(),
}));

vi.mock("../../payment/paymentService", () => ({
  paymentService: {
    createPayment: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("CheckoutView form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Default language ES
  });

  function renderView(cartInitialState) {
    return renderWithProviders(
      <Routes>
        <Route path="/checkout/:checkoutId" element={<CheckoutView />} />
      </Routes>,
      {
        route: "/checkout/checkout-1",
        cartInitialState,
      }
    );
  }

  it("renders customer + shipping form fields", async () => {
    renderView({
      status: "ready",
      error: "",
      cart: {
        cartId: "cart-1",
        items: [{ productId: "p1", name: "Product 1", quantity: 1, unitPriceUSD: 10 }],
        totals: { subtotalUSD: 10 },
        metadata: {},
      },
    });

    expect(
      await screen.findByRole("heading", { name: /información de envío/i })
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText(/alexander wright/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@email.com/i)).toBeInTheDocument();

    // pickup default => address disabled
    expect(screen.getByPlaceholderText(/caracas/i)).toBeDisabled();
    expect(screen.getByPlaceholderText(/av principal/i)).toBeDisabled();
    expect(screen.getByPlaceholderText(/carabobo/i)).toBeDisabled();
  });

  it(
    "saves customer + shipping and navigates to payment page",
    async () => {
      const user = userEvent.setup();

      updateCheckoutCustomer.mockResolvedValue({});
      updateCheckoutShipping.mockResolvedValue({});
      paymentService.createPayment.mockResolvedValue({ data: { paymentId: "pay-1" } });

      renderView({
        status: "ready",
        error: "",
        cart: {
          cartId: "cart-1",
          items: [{ productId: "p1", name: "Product 1", quantity: 1, unitPriceUSD: 10 }],
          totals: { subtotalUSD: 10 },
          metadata: {},
        },
      });

      expect(
        await screen.findByRole("heading", { name: /información de envío/i })
      ).toBeInTheDocument();

      await user.type(screen.getByPlaceholderText(/alexander wright/i), "Sara Tester");
      await user.type(screen.getByPlaceholderText(/you@email.com/i), "sara@gmail.com");
      await user.type(screen.getByPlaceholderText(/\+58 414/i), "04141234567");

      // Select National Shipping (shipping method) to enable address fields
      const shippingButton = screen.getByRole("button", { name: /envío nacional/i });
      await user.click(shippingButton);

      const city = screen.getByPlaceholderText(/caracas/i);
      const street = screen.getByPlaceholderText(/av principal/i);
      const state = screen.getByPlaceholderText(/carabobo/i);

      await waitFor(() => {
        expect(city).not.toBeDisabled();
        expect(street).not.toBeDisabled();
        expect(state).not.toBeDisabled();
      });

      await user.clear(city);
      await user.clear(street);
      await user.clear(state);

      await user.type(city, "Caracas");
      await user.type(street, "Av 1");
      await user.type(state, "Distrito Capital");

      const continueBtn = screen.getByRole("button", { name: /continuar con el pago/i });
      await user.click(continueBtn);

      await waitFor(() => {
        expect(updateCheckoutCustomer).toHaveBeenCalledWith("checkout-1", {
          name: "Sara Tester",
          email: "sara@gmail.com",
          phone: "04141234567",
        });

        expect(updateCheckoutShipping).toHaveBeenCalledWith("checkout-1", {
          method: "national_shipping",
          address: {
            recipientName: "Sara Tester",
            phone: "04141234567",
            state: "Distrito Capital",
            city: "Caracas",
            line1: "Av 1",
            reference: null,
          },
        });

        expect(paymentService.createPayment).toHaveBeenCalledWith({
          checkoutId: "checkout-1",
          method: "zelle",
        });

        expect(mockNavigate).toHaveBeenCalledWith("/payments/pay-1");
      });
    },
    15000
  );

  it("does not submit when required fields are missing", async () => {
    const user = userEvent.setup();

    renderView({
      status: "ready",
      error: "",
      cart: {
        cartId: "cart-1",
        items: [{ productId: "p1", name: "Product 1", quantity: 1, unitPriceUSD: 10 }],
        totals: { subtotalUSD: 10 },
        metadata: {},
      },
    });

    expect(
      await screen.findByRole("heading", { name: /información de envío/i })
    ).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/alexander wright/i), "Sa");
    await user.type(screen.getByPlaceholderText(/you@email.com/i), "s@a");

    const continueBtn = screen.getByRole("button", { name: /continuar con el pago/i });
    expect(continueBtn).toBeDisabled();
    expect(updateCheckoutCustomer).not.toHaveBeenCalled();
  });
});