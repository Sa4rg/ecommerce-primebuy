import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../../context/AuthContext.jsx";
import { CartProvider } from "../../../context/CartContext.jsx";
import { LoginView } from "./LoginView";
import { LanguageProvider } from "../../../shared/i18n/LanguageContext.jsx";

describe("LoginView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("stores accessToken and navigates to /account on success", async () => {
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
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <MemoryRouter initialEntries={[{ pathname: "/login", state: { from: { pathname: "/account" } } }]}>
              <Routes>
                <Route path="/login" element={<LoginView />} />
                <Route path="/account" element={<h1>Mi Cuenta</h1>} />
              </Routes>
            </MemoryRouter>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    );

    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/name@company\.com/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/••••/), "Password123!");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(localStorage.getItem("accessToken")).toBe("token-123");
    });

    expect(screen.getByRole("heading", { name: /mi cuenta/i })).toBeInTheDocument();
  });
});
