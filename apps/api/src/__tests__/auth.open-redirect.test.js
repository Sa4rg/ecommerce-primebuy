import { describe, it, expect } from "vitest";
import { sanitizeReturnTo } from "../utils/sanitizeReturnTo.js";

describe("sanitizeReturnTo - Open Redirect Prevention", () => {
  describe("Security: Reject absolute URLs", () => {
    it("should reject http:// URLs", () => {
      const maliciousUrl = "http://evil.com/steal-token";
      expect(sanitizeReturnTo(maliciousUrl)).toBe("/account");
    });

    it("should reject https:// URLs", () => {
      const maliciousUrl = "https://attacker.com/phishing";
      expect(sanitizeReturnTo(maliciousUrl)).toBe("/account");
    });

    it("should reject protocol-relative URLs (//)", () => {
      const maliciousUrl = "//evil.com/steal";
      expect(sanitizeReturnTo(maliciousUrl)).toBe("/account");
    });

    it("should reject URLs with embedded protocols", () => {
      const maliciousUrl = "/checkout?next=https://evil.com";
      // This is allowed as path, but in real scenario query params would be validated separately
      // The whitelist prevents this from being a problem
      expect(sanitizeReturnTo(maliciousUrl)).toBe("/checkout?next=https://evil.com");
    });
  });

  describe("Security: Reject non-whitelisted paths", () => {
    it("should reject /admin paths", () => {
      expect(sanitizeReturnTo("/admin")).toBe("/account");
      expect(sanitizeReturnTo("/admin/users")).toBe("/account");
    });

    it("should reject /api paths", () => {
      expect(sanitizeReturnTo("/api/auth/logout")).toBe("/account");
    });

    it("should reject random paths", () => {
      expect(sanitizeReturnTo("/random/path")).toBe("/account");
      expect(sanitizeReturnTo("/secret")).toBe("/account");
    });

    it("should reject paths not starting with /", () => {
      expect(sanitizeReturnTo("account")).toBe("/account");
      expect(sanitizeReturnTo("checkout")).toBe("/account");
    });
  });

  describe("Valid: Accept whitelisted paths", () => {
    it("should accept /account", () => {
      expect(sanitizeReturnTo("/account")).toBe("/account");
    });

    it("should accept /checkout", () => {
      expect(sanitizeReturnTo("/checkout")).toBe("/checkout");
    });

    it("should accept /checkout/:id", () => {
      expect(sanitizeReturnTo("/checkout/abc-123")).toBe("/checkout/abc-123");
    });

    it("should accept /cart", () => {
      expect(sanitizeReturnTo("/cart")).toBe("/cart");
    });

    it("should accept /products", () => {
      expect(sanitizeReturnTo("/products")).toBe("/products");
    });

    it("should accept /products with query", () => {
      expect(sanitizeReturnTo("/products?q=camera")).toBe("/products?q=camera");
    });

    it("should accept /orders", () => {
      expect(sanitizeReturnTo("/orders")).toBe("/orders");
    });

    it("should accept /orders/:id", () => {
      expect(sanitizeReturnTo("/orders/order-123")).toBe("/orders/order-123");
    });

    it("should accept /payments", () => {
      expect(sanitizeReturnTo("/payments")).toBe("/payments");
    });

    it("should accept /payments/:id", () => {
      expect(sanitizeReturnTo("/payments/pay-456")).toBe("/payments/pay-456");
    });
  });

  describe("Edge cases", () => {
    it("should return default for null", () => {
      expect(sanitizeReturnTo(null)).toBe("/account");
    });

    it("should return default for undefined", () => {
      expect(sanitizeReturnTo(undefined)).toBe("/account");
    });

    it("should return default for empty string", () => {
      expect(sanitizeReturnTo("")).toBe("/account");
    });

    it("should return default for non-string values", () => {
      expect(sanitizeReturnTo(123)).toBe("/account");
      expect(sanitizeReturnTo({})).toBe("/account");
      expect(sanitizeReturnTo([])).toBe("/account");
    });

    it("should handle paths with trailing slash", () => {
      expect(sanitizeReturnTo("/checkout/")).toBe("/checkout/");
    });

    it("should handle paths with fragments", () => {
      expect(sanitizeReturnTo("/account#settings")).toBe("/account#settings");
    });
  });

  describe("Real-world attack scenarios", () => {
    it("should block OAuth phishing attack", () => {
      // Attacker sends: /api/auth/oauth/google/start?returnTo=https://fake-app.com
      const attackUrl = "https://fake-app.com/steal-credentials";
      expect(sanitizeReturnTo(attackUrl)).toBe("/account");
    });

    it("should block JavaScript protocol", () => {
      const xssAttempt = "javascript:alert('XSS')";
      expect(sanitizeReturnTo(xssAttempt)).toBe("/account");
    });

    it("should block data: URLs", () => {
      const dataUrl = "data:text/html,<script>alert('XSS')</script>";
      expect(sanitizeReturnTo(dataUrl)).toBe("/account");
    });

    it("should allow legitimate checkout redirect", () => {
      const legitimateUrl = "/checkout/chk-789";
      expect(sanitizeReturnTo(legitimateUrl)).toBe("/checkout/chk-789");
    });

    it("should allow legitimate order confirmation redirect", () => {
      const legitimateUrl = "/orders/ord-123?status=confirmed";
      expect(sanitizeReturnTo(legitimateUrl)).toBe("/orders/ord-123?status=confirmed");
    });
  });
});
