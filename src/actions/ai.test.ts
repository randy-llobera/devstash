import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  checkAiRateLimitMock,
  getBillingStateMock,
  getOpenAIClientMock,
  openAIResponsesCreateMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  checkAiRateLimitMock: vi.fn(),
  getBillingStateMock: vi.fn(),
  getOpenAIClientMock: vi.fn(),
  openAIResponsesCreateMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/billing", () => ({
  getBillingState: getBillingStateMock,
}));

vi.mock("@/lib/openai", () => ({
  AI_MODEL: "gpt-5-nano",
  getOpenAIClient: getOpenAIClientMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkAiRateLimit: checkAiRateLimitMock,
  getRateLimitMessage: (reset: number) =>
    `Too many attempts. Please try again in ${Math.max(1, Math.ceil((reset - Date.now()) / 60_000))} minute(s).`,
  isRateLimitUnavailable: (result: { reason: "limited" | "unavailable" | null }) =>
    result.reason === "unavailable",
}));

import { generateAutoTags } from "@/actions/ai";

describe("generateAutoTags action", () => {
  beforeEach(() => {
    authMock.mockReset();
    checkAiRateLimitMock.mockReset();
    getBillingStateMock.mockReset();
    getOpenAIClientMock.mockReset();
    openAIResponsesCreateMock.mockReset();
    getOpenAIClientMock.mockReturnValue({
      responses: {
        create: openAIResponsesCreateMock,
      },
    });
    checkAiRateLimitMock.mockResolvedValue({
      remaining: 19,
      reason: null,
      reset: Date.now(),
      success: true,
    });
  });

  it("rejects unauthenticated AI tag requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await generateAutoTags({
      itemType: "snippet",
      title: "Sort an array",
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to suggest tags.",
    });
    expect(openAIResponsesCreateMock).not.toHaveBeenCalled();
  });

  it("blocks free users from AI tag suggestions", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: false,
      itemCount: 2,
    });

    const result = await generateAutoTags({
      content: "const sorted = items.sort(compare);",
      itemType: "snippet",
      tags: [],
      title: "Sort helper",
    });

    expect(result).toEqual({
      success: false,
      error: "Upgrade to Pro to use AI tag suggestions.",
    });
    expect(openAIResponsesCreateMock).not.toHaveBeenCalled();
  });

  it("returns a rate limit message when the AI bucket is exceeded", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    checkAiRateLimitMock.mockResolvedValue({
      remaining: 0,
      reason: "limited",
      reset: Date.now() + 120_000,
      success: false,
    });

    const result = await generateAutoTags({
      content: "const sorted = items.sort(compare);",
      itemType: "snippet",
      tags: [],
      title: "Sort helper",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Too many attempts.");
    expect(openAIResponsesCreateMock).not.toHaveBeenCalled();
  });

  it("normalizes OpenAI suggestions, removes existing tags, and limits to five tags", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({
        tags: ["React", "hooks", "react", "#TypeScript", "forms", "ui", "testing"],
      }),
    });

    const result = await generateAutoTags({
      content: "Build a React form hook with TypeScript validation.",
      itemType: "snippet",
      tags: ["react"],
      title: "Form hook",
    });

    expect(openAIResponsesCreateMock).toHaveBeenCalledOnce();
    expect(result).toEqual({
      success: true,
      data: {
        tags: ["hooks", "typescript", "forms", "ui", "testing"],
      },
    });
  });

  it("accepts array-shaped OpenAI responses", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify(["Next.js", "Caching", "Server Actions"]),
    });

    const result = await generateAutoTags({
      content: "Use server actions with caching in a Next.js app.",
      itemType: "note",
      tags: [],
      title: "Next.js notes",
    });

    expect(result).toEqual({
      success: true,
      data: {
        tags: ["next.js", "caching", "server actions"],
      },
    });
  });

  it("returns a safe error when the AI response is invalid", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: "not json",
    });

    const result = await generateAutoTags({
      content: "console.log('hi')",
      itemType: "snippet",
      tags: [],
      title: "Logger",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to generate tag suggestions right now.",
    });
  });
});
