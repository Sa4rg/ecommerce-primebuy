import { describe, it, expect } from "vitest";
import { formatShortId } from "./formatId";

describe("formatShortId", () => {
  it("returns empty string for null or undefined", () => {
    expect(formatShortId(null)).toBe("");
    expect(formatShortId(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatShortId("")).toBe("");
  });

  it("truncates UUID to 8 characters by default", () => {
    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(formatShortId(uuid)).toBe("a1b2c3d4");
  });

  it("truncates to custom length", () => {
    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(formatShortId(uuid, 12)).toBe("a1b2c3d4-e5f");
  });

  it("returns full string if shorter than length", () => {
    expect(formatShortId("short", 8)).toBe("short");
  });

  it("handles numeric IDs", () => {
    expect(formatShortId(12345678901234, 8)).toBe("12345678");
  });

  it("preserves case", () => {
    expect(formatShortId("AbCdEfGh12345678")).toBe("AbCdEfGh");
  });
});
