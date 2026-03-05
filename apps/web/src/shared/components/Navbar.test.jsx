import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/renderWithProviders.jsx";
import { Navbar } from "./Navbar.jsx";

describe("Navbar i18n integration", () => {
  it("renders Spanish by default", () => {
    renderWithProviders(<Navbar />, { route: "/" });

    expect(screen.getByText("Electrónica")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar productos...")).toBeInTheDocument();
  });

  it("switches language to English (nav + right actions)", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Navbar />, { route: "/" });

    // default ES
    expect(screen.getByText("Electrónica")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "EN" }));

    // search
    expect(screen.getByPlaceholderText("Search products...")).toBeInTheDocument();

    // right actions (public state -> Login visible)
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();

    // cart accessibility label
    expect(screen.getByRole("link", { name: "Cart" })).toBeInTheDocument();
  });
});