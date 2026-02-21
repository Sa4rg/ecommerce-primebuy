import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PaymentStatusPage } from "./PaymentStatusPage.jsx";
import { CartProvider } from "../../../context/CartContext.jsx";
import { AuthProvider } from "../../../context/AuthContext.jsx";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderWithRouter(paymentId = "pay-123") {
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={[`/payment/${paymentId}`]}>
          <Routes>
            <Route path="/payment/:paymentId" element={<PaymentStatusPage />} />
            <Route path="/orders/:orderId" element={<div>Order Page</div>} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );
}

// Helper to mock fetch responses
function mockFetchPayment(paymentData) {
  vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
    if (url.includes("/api/payments/") && (!opts || opts.method === "GET" || !opts.method)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: paymentData }),
      });
    }
    if (url.includes("/api/payments/") && opts?.method === "PATCH") {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { ...paymentData, status: "submitted" } }),
      });
    }
    return Promise.reject(new Error("Unexpected fetch"));
  });
}

function mockFetchError(errorMessage) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ success: false, message: errorMessage }),
  });
}

describe("PaymentStatusPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows loading initially, then displays payment details", async () => {
    mockFetchPayment({
      paymentId: "pay-123",
      orderId: "pay-123",
      method: "zelle",
      amount: 50,
      currency: "USD",
      status: "pending",
    });

    renderWithRouter();

    // Initial load
    await waitFor(() => {
      expect(screen.getByText(/#pay-123/i)).toBeInTheDocument();
    });

    // Use getAllByText since "zelle" appears in method AND instructions
    expect(screen.getAllByText(/zelle/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/50 USD/i)).toBeInTheDocument();
  });

  it("shows error when payment fails to load", async () => {
    mockFetchError("Payment not found");

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/payment not found/i)).toBeInTheDocument();
    });
  });

  it("shows submit proof form when status is pending", async () => {
    mockFetchPayment({
      paymentId: "pay-123",
      method: "zelle",
      amount: 50,
      currency: "USD",
      status: "pending",
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /submit proof|enviar comprobante/i })).toBeInTheDocument();
  });

  it("submits proof and updates payment status", async () => {
    mockFetchPayment({
      paymentId: "pay-123",
      method: "zelle",
      amount: 50,
      currency: "USD",
      status: "pending",
    });

    renderWithRouter();

    // Wait for form
    await waitFor(() => {
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    // Fill reference
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "REF-12345" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /submit proof|enviar comprobante/i }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/payments/pay-123/submit"),
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });

  it("shows waiting message when status is submitted", async () => {
    mockFetchPayment({
      paymentId: "pay-123",
      method: "zelle",
      amount: 50,
      currency: "USD",
      status: "submitted",
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/waiting for admin confirmation|esperando confirmaci[oó]n/i)).toBeInTheDocument();
    });
  });

  it("shows confirmation and order link when status is confirmed", async () => {
    mockFetchPayment({
      paymentId: "pay-123",
      method: "zelle",
      amount: 50,
      currency: "USD",
      status: "confirmed",
      orderId: "order-456",
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/payment confirmed|pago confirmado/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /view your order|ver tu orden/i })).toHaveAttribute(
      "href",
      "/orders/order-456"
    );
  });

  it("shows rejection reason and retry button when status is rejected", async () => {
    mockFetchPayment({
      paymentId: "pay-123",
      method: "zelle",
      amount: 50,
      currency: "USD",
      status: "rejected",
      checkoutId: "checkout-789",
      review: { reason: "Invalid reference" },
    });

    renderWithRouter();

    // Wait for the rejection message specifically (supports localized UI strings)
    await waitFor(() => {
      expect(screen.getByText(/Rejected:|Rechazado:/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/invalid reference/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose another method|volver al checkout/i })).toBeInTheDocument();
  });

  it("navigates to payment method selection when rejected and user clicks retry", async () => {
    mockFetchPayment({
      paymentId: "pay-123",
      method: "zelle",
      status: "rejected",
      checkoutId: "checkout-789",
      review: { reason: "Bad ref" },
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /choose another method|volver al checkout/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /choose another method|volver al checkout/i }));

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/checkout\/checkout-789(?:\/payment)?$/));
  });
});
