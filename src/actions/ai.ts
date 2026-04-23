"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { getBillingState } from "@/lib/db/billing";
import { getOpenAIClient, AI_MODEL } from "@/lib/openai";
import { checkAiRateLimit, getRateLimitMessage, isRateLimitUnavailable } from "@/lib/rate-limit";
import { canUseAiFeatures } from "@/lib/usage-limits";

const autoTagSchema = z.object({
  itemType: z.string().trim().min(1, "Item type is required."),
  title: z.string().trim().max(200).default(""),
  description: z.string().trim().max(500).optional(),
  content: z.string().trim().optional(),
  language: z.string().trim().max(100).optional(),
  url: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1)).max(25).default([]),
});

type GenerateAutoTagsPayload = z.input<typeof autoTagSchema>;

interface GenerateAutoTagsActionResult {
  success: boolean;
  data?: {
    tags: string[];
  };
  error?: string;
}

const AUTO_TAG_RATE_LIMIT_UNAVAILABLE_MESSAGE =
  "AI suggestions are temporarily unavailable. Please try again shortly.";

const autoTagResponseSchema = z.union([
  z.array(z.string()),
  z.object({
    tags: z.array(z.string()),
  }),
]);

const normalizeTag = (value: string) =>
  value
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

const truncateAutoTagContent = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value.slice(0, 2_000);
};

const getUrlHostname = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
};

const parseAutoTagResponse = (outputText: string, existingTags: string[]) => {
  const parsedJson = JSON.parse(outputText) as unknown;
  const parsedResponse = autoTagResponseSchema.parse(parsedJson);
  const rawTags = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.tags;
  const existingTagSet = new Set(existingTags.map(normalizeTag));
  const normalizedTags = Array.from(
    new Set(
      rawTags
        .map(normalizeTag)
        .filter((tag) => tag.length > 0 && !existingTagSet.has(tag)),
    ),
  ).slice(0, 5);

  if (normalizedTags.length === 0) {
    throw new Error("No valid tag suggestions were returned.");
  }

  return normalizedTags;
};

const buildAutoTagPrompt = (data: z.output<typeof autoTagSchema>) => {
  const promptSections = [
    'Return valid JSON in the shape {"tags":["tag"]}.',
    `Item type: ${data.itemType}`,
    `Title: ${data.title || "N/A"}`,
    `Description: ${data.description || "N/A"}`,
    `Language: ${data.language || "N/A"}`,
    `URL hostname: ${getUrlHostname(data.url) || "N/A"}`,
    `Existing tags: ${data.tags.length > 0 ? data.tags.join(", ") : "None"}`,
    `Content (truncated to 2000 chars):\n${truncateAutoTagContent(data.content) || "N/A"}`,
  ];

  return promptSections.join("\n\n");
};

const getOpenAIErrorStatus = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  typeof error.status === "number"
    ? error.status
    : null;

const getOpenAIErrorRequestId = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "request_id" in error &&
  typeof error.request_id === "string"
    ? error.request_id
    : typeof error === "object" &&
        error !== null &&
        "requestID" in error &&
        typeof error.requestID === "string"
      ? error.requestID
      : null;

export const generateAutoTags = async (
  data: GenerateAutoTagsPayload,
): Promise<GenerateAutoTagsActionResult> => {
  const parsedPayload = autoTagSchema.safeParse({
    ...data,
    content: data.content?.trim() ?? "",
    description: data.description?.trim() ?? "",
    language: data.language?.trim() ?? "",
    tags: data.tags ?? [],
    title: data.title?.trim() ?? "",
    url: data.url?.trim() ?? "",
  });

  if (!parsedPayload.success) {
    return {
      success: false,
      error: "Enter a valid item before requesting tag suggestions.",
    };
  }

  if (!parsedPayload.data.title && !parsedPayload.data.description && !parsedPayload.data.content) {
    return {
      success: false,
      error: "Add a title or content before requesting tag suggestions.",
    };
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to suggest tags.",
    };
  }

  const billingState = await getBillingState(userId);

  if (!billingState) {
    return {
      success: false,
      error: "User not found.",
    };
  }

  if (!canUseAiFeatures({ isPro: billingState.isPro })) {
    return {
      success: false,
      error: "Upgrade to Pro to use AI tag suggestions.",
    };
  }

  const rateLimitResult = await checkAiRateLimit({
    identifier: userId,
    type: "autoTag",
  });

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: isRateLimitUnavailable(rateLimitResult)
        ? AUTO_TAG_RATE_LIMIT_UNAVAILABLE_MESSAGE
        : getRateLimitMessage(rateLimitResult.reset),
    };
  }

  try {
    const response = await getOpenAIClient().responses.create({
      model: AI_MODEL,
      instructions:
        "You suggest 3 to 5 concise freeform tags for a developer knowledge item. Return JSON only in the shape {\"tags\": [\"tag\"]}. Use lowercase tags, avoid duplicates, avoid generic filler, and do not repeat any existing tags.",
      input: buildAutoTagPrompt(parsedPayload.data),
      metadata: {
        feature: "auto-tagging",
        userId,
      },
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    if (!response.output_text) {
      return {
        success: false,
        error: "Unable to generate tag suggestions right now.",
      };
    }

    return {
      success: true,
      data: {
        tags: parseAutoTagResponse(response.output_text, parsedPayload.data.tags),
      },
    };
  } catch (error) {
    const status = getOpenAIErrorStatus(error);
    const requestId = getOpenAIErrorRequestId(error);

    console.error("Failed to generate auto tags.", {
      error,
      feature: "auto-tagging",
      requestId,
      status,
      userId,
    });

    if (status === 429) {
      return {
        success: false,
        error: "AI suggestions are temporarily rate limited. Please try again shortly.",
      };
    }

    if (status === 400 || status === 401 || status === 403 || status === 422 || (status ?? 0) >= 500) {
      return {
        success: false,
        error: AUTO_TAG_RATE_LIMIT_UNAVAILABLE_MESSAGE,
      };
    }

    return {
      success: false,
      error: "Unable to generate tag suggestions right now.",
    };
  }
};
