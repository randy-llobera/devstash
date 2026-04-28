import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("resend", () => ({
  Resend: vi.fn(),
}));

import {
  escapeHtml,
  getAuthEmailBaseUrl,
  getAuthTokenIdentifiersForEmail,
  getPasswordResetEmail,
  getPasswordResetIdentifier,
  isEmailVerificationIdentifier,
} from "@/lib/email-verification";

describe("email verification utilities", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses AUTH_URL as the trusted email base URL", () => {
    vi.stubEnv("AUTH_URL", "https://devstash.example.com/auth/callback");
    vi.stubEnv("NEXTAUTH_URL", "https://fallback.example.com");

    expect(getAuthEmailBaseUrl()).toBe("https://devstash.example.com");
  });

  it("falls back to NEXTAUTH_URL when AUTH_URL is missing", () => {
    vi.stubEnv("AUTH_URL", undefined);
    vi.stubEnv("NEXTAUTH_URL", "https://devstash.example.com/sign-in");

    expect(getAuthEmailBaseUrl()).toBe("https://devstash.example.com");
  });

  it("escapes user-provided HTML fragments before email rendering", () => {
    expect(escapeHtml(`A&B <Admin> "User" 'Name'`)).toBe(
      "A&amp;B &lt;Admin&gt; &quot;User&quot; &#39;Name&#39;"
    );
  });

  it("builds separate identifiers for email verification and password reset tokens", () => {
    expect(isEmailVerificationIdentifier("user@example.com")).toBe(true);
    expect(isEmailVerificationIdentifier("password-reset:user@example.com")).toBe(false);
    expect(getPasswordResetIdentifier("user@example.com")).toBe(
      "password-reset:user@example.com"
    );
    expect(getPasswordResetEmail("password-reset:user@example.com")).toBe("user@example.com");
    expect(getPasswordResetEmail("user@example.com")).toBeNull();
    expect(getAuthTokenIdentifiersForEmail("user@example.com")).toEqual([
      "user@example.com",
      "password-reset:user@example.com",
    ]);
  });
});
