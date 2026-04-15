import {
  getRateLimitErrorCode,
  getRateLimitMessage,
  getRateLimitMessageFromCode,
  getRateLimitMinutesUntilReset,
  getRequestIp,
} from "@/lib/rate-limit";

describe("rate-limit utilities", () => {
  it("uses the first forwarded IP address", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 198.51.100.4",
      },
    });

    expect(getRequestIp(request)).toBe("203.0.113.10");
  });

  it("falls back through alternate IP headers", () => {
    const request = new Request("https://example.com", {
      headers: {
        "cf-connecting-ip": "198.51.100.8",
      },
    });

    expect(getRequestIp(request)).toBe("198.51.100.8");
  });

  it("rounds rate limit reset times up to whole minutes", () => {
    vi.setSystemTime(new Date("2026-04-15T12:00:00.000Z"));

    expect(
      getRateLimitMinutesUntilReset(Date.parse("2026-04-15T12:00:01.000Z")),
    ).toBe(1);
    expect(
      getRateLimitMinutesUntilReset(Date.parse("2026-04-15T12:02:01.000Z")),
    ).toBe(3);
  });

  it("creates consistent messages and error codes", () => {
    vi.setSystemTime(new Date("2026-04-15T12:00:00.000Z"));
    const reset = Date.parse("2026-04-15T12:01:30.000Z");

    expect(getRateLimitMessage(reset)).toBe(
      "Too many attempts. Please try again in 2 minutes.",
    );
    expect(getRateLimitErrorCode(reset)).toBe("rate_limited_2");
    expect(getRateLimitMessageFromCode("rate_limited_2")).toBe(
      "Too many attempts. Please try again in 2 minutes.",
    );
    expect(getRateLimitMessageFromCode("rate_limited_bad")).toBeNull();
  });
});
