import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AdminPaymentsPage } from "./AdminPaymentsPage.jsx";
import { adminService } from "../adminService";

function renderWithRouter(ui, { route = "/admin/payments" } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

vi.mock("../adminService");

describe("AdminPaymentsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("shows loading state initially, then displays payments table", async () => {
    const mockPayments = [
      {
        paymentId: "pay-123-abc",
        method: "zelle",
        amount: 50,
        currency: "USD",
        reference: "REF-001",
        status: "submitted",
        createdAt: "2026-01-15T10:00:00Z",
      },
    ];

    adminService.listPayments.mockResolvedValue(mockPayments);

    renderWithRouter(<AdminPaymentsPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/pay-123/i)).toBeInTheDocument();
    expect(screen.getByText(/zelle/i)).toBeInTheDocument();
    expect(screen.getByText(/\$50\.00 USD/i)).toBeInTheDocument();
    expect(screen.getByText(/REF-001/i)).toBeInTheDocument();
  });

  it("shows error message when loading fails", async () => {
    adminService.listPayments.mockRejectedValue(new Error("Network error"));

    renderWithRouter(<AdminPaymentsPage />);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("shows 'No payments found' when list is empty", async () => {
    adminService.listPayments.mockResolvedValue([]);

    renderWithRouter(<AdminPaymentsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no payments found/i)).toBeInTheDocument();
    });
  });

  it("calls confirmPayment when Confirm button is clicked", async () => {
    const mockPayments = [
      {
        paymentId: "pay-to-confirm",
        method: "zelle",
        amount: 100,
        currency: "USD",
        status: "submitted",
      },
    ];

    adminService.listPayments.mockResolvedValue(mockPayments);
    adminService.confirmPayment.mockResolvedValue({
      paymentId: "pay-to-confirm",
      status: "confirmed",
      order: { orderId: "order-123" },
    });

    renderWithRouter(<AdminPaymentsPage />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /confirm/i }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole("button", { name: /confirm/i })[1]);

    await waitFor(() => {
      expect(adminService.confirmPayment).toHaveBeenCalledWith("pay-to-confirm");
    });

    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("order-123"));
  });

  it("opens reject modal and submits rejection with reason", async () => {
    const mockPayments = [
      {
        paymentId: "pay-to-reject",
        method: "pago_movil",
        amount: 500,
        currency: "VES",
        status: "submitted",
      },
    ];

    adminService.listPayments.mockResolvedValue(mockPayments);
    adminService.rejectPayment.mockResolvedValue({ paymentId: "pay-to-reject", status: "rejected" });

    renderWithRouter(<AdminPaymentsPage />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /reject/i }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole("button", { name: /reject/i })[1]);

    await waitFor(() => {
      expect(screen.getByText(/please provide a reason/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/reason for rejection/i);
    fireEvent.change(textarea, { target: { value: "Invalid reference number" } });

    fireEvent.click(screen.getByRole("button", { name: /reject payment/i }));

    await waitFor(() => {
      expect(adminService.rejectPayment).toHaveBeenCalledWith("pay-to-reject", "Invalid reference number");
    });
  });

  it("changes filter and reloads payments", async () => {
    adminService.listPayments.mockResolvedValue([]);

    renderWithRouter(<AdminPaymentsPage />);

    await waitFor(() => {
      expect(adminService.listPayments).toHaveBeenCalledWith({});
    });

    fireEvent.click(screen.getByRole("button", { name: /confirmed/i }));

    await waitFor(() => {
      expect(adminService.listPayments).toHaveBeenCalledWith({ status: "confirmed" });
    });
  });
});
