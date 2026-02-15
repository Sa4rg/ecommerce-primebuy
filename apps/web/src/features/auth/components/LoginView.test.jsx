import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../../context/AuthContext.jsx";
import { LoginView } from "./LoginView";

describe("LoginView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("stores accessToken and navigates to /checkout on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: "Login successful",
        data: { accessToken: "token-123" },
      }),
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginView />} />
            <Route path="/checkout" element={<h2>Checkout</h2>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(localStorage.getItem("accessToken")).toBe("token-123");
    });

    expect(screen.getByRole("heading", { name: /checkout/i })).toBeInTheDocument();
  });
});
