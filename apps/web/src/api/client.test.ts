import { describe, expect, it } from "vitest";
import {
  JudgeApiConfigurationError,
  normalizePublicApiBaseUrl,
} from "./client";

describe("normalizePublicApiBaseUrl", () => {
  it("returns null when the API is intentionally not configured", () => {
    expect(normalizePublicApiBaseUrl(undefined)).toBeNull();
    expect(normalizePublicApiBaseUrl("  ")).toBeNull();
  });

  it("normalizes a public HTTPS API URL", () => {
    expect(
      normalizePublicApiBaseUrl("https://abc123.execute-api.us-east-1.amazonaws.com/"),
    ).toBe("https://abc123.execute-api.us-east-1.amazonaws.com");
  });

  it("allows HTTP only for local development", () => {
    expect(normalizePublicApiBaseUrl("http://localhost:3000/"))
      .toBe("http://localhost:3000");
    expect(() => normalizePublicApiBaseUrl("http://example.com")).toThrow(
      JudgeApiConfigurationError,
    );
  });

  it("rejects credentials and query parameters in the public configuration", () => {
    expect(() => normalizePublicApiBaseUrl("https://user:pass@example.com"))
      .toThrow(JudgeApiConfigurationError);
    expect(() => normalizePublicApiBaseUrl("https://example.com?token=secret"))
      .toThrow(JudgeApiConfigurationError);
  });
});
