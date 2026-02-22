import React from "react";
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { LanguageProvider } from "./LanguageContext.jsx";
import { useTranslation } from "./useTranslation.js";

function TestComponent() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div>
      <div data-testid="lang">{language}</div>
      <div data-testid="text">{t("navbar.electronics")}</div>
      <button onClick={() => setLanguage("en")}>EN</button>
      <button onClick={() => setLanguage("es")}>ES</button>
    </div>
  );
}

describe("useTranslation", () => {
  it("returns Spanish text by default", () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId("lang")).toHaveTextContent("es");
    expect(screen.getByTestId("text")).toHaveTextContent("Electrónica");
  });

  it("changes language dynamically", async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    await user.click(screen.getByText("EN"));

    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(screen.getByTestId("text")).toHaveTextContent("Electronics");
  });

  it("falls back to key if translation is missing", () => {
    function MissingKey() {
      const { t } = useTranslation();
      return <div data-testid="missing">{t("unknown.key")}</div>;
    }

    render(
      <LanguageProvider>
        <MissingKey />
      </LanguageProvider>
    );

    expect(screen.getByTestId("missing")).toHaveTextContent("unknown.key");
  });
});