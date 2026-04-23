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

const descriptionSummarySchema = z.object({
  itemType: z.string().trim().min(1, "Item type is required."),
  title: z.string().trim().max(200).default(""),
  description: z.string().trim().max(500).optional(),
  content: z.string().trim().optional(),
  language: z.string().trim().max(100).optional(),
  url: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
  fileName: z.string().trim().max(255).optional(),
  fileSize: z.number().int().nonnegative().optional(),
});

type GenerateDescriptionSummaryPayload = z.input<typeof descriptionSummarySchema>;

const explainCodeSchema = z.object({
  itemType: z.enum(["snippet", "command"]),
  title: z.string().trim().max(200).default(""),
  content: z.string().trim().min(1, "Content is required."),
  language: z.string().trim().max(100).optional(),
});

type ExplainCodePayload = z.input<typeof explainCodeSchema>;

const optimizePromptSchema = z.object({
  title: z.string().trim().max(200).default(""),
  description: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1, "Content is required."),
});

type OptimizePromptPayload = z.input<typeof optimizePromptSchema>;

interface GenerateAutoTagsActionResult {
  success: boolean;
  data?: {
    tags: string[];
  };
  error?: string;
}

interface GenerateDescriptionSummaryActionResult {
  success: boolean;
  data?: {
    summary: string;
  };
  error?: string;
}

interface ExplainCodeActionResult {
  success: boolean;
  data?: {
    explanation: string;
  };
  error?: string;
}

interface OptimizePromptActionResult {
  success: boolean;
  data?: {
    changed: boolean;
    optimizedPrompt: string | null;
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

const descriptionSummaryResponseSchema = z.union([
  z.string(),
  z.object({
    summary: z.string(),
  }),
]);

const explainCodeResponseSchema = z.union([
  z.string(),
  z.object({
    explanation: z.string(),
  }),
]);

const optimizePromptResponseSchema = z.object({
  changed: z.boolean(),
  optimizedPrompt: z.string(),
});

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

const truncateSummaryContent = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value.slice(0, 4_000);
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

const formatFileSize = (value: number | null | undefined) => {
  if (value === null || value === undefined || value <= 0) {
    return null;
  }

  if (value < 1024) {
    return `${value} B`;
  }

  const units = ["KB", "MB", "GB"];
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 ? Math.round(size) : size.toFixed(1)} ${units[unitIndex]}`;
};

const parseDescriptionSummaryResponse = (outputText: string) => {
  const parsedJson = JSON.parse(outputText) as unknown;
  const parsedResponse = descriptionSummaryResponseSchema.parse(parsedJson);
  const summary =
    typeof parsedResponse === "string" ? parsedResponse : parsedResponse.summary;
  const normalizedSummary = summary.replace(/\s+/g, " ").trim();

  if (!normalizedSummary) {
    throw new Error("No summary was returned.");
  }

  return normalizedSummary;
};

const parseExplainCodeResponse = (outputText: string) => {
  const parsedJson = JSON.parse(outputText) as unknown;
  const parsedResponse = explainCodeResponseSchema.parse(parsedJson);
  const explanation =
    typeof parsedResponse === "string"
      ? parsedResponse
      : parsedResponse.explanation;
  const normalizedExplanation = explanation.trim();

  if (!normalizedExplanation) {
    throw new Error("No explanation was returned.");
  }

  return normalizedExplanation;
};

const parseOptimizePromptResponse = (
  outputText: string,
  currentPrompt: string,
) => {
  const parsedJson = JSON.parse(outputText) as unknown;
  const parsedResponse = optimizePromptResponseSchema.parse(parsedJson);
  const normalizedPrompt = parsedResponse.optimizedPrompt.trim();
  const hasMeaningfulChange =
    parsedResponse.changed && normalizedPrompt.length > 0 && normalizedPrompt !== currentPrompt.trim();

  return {
    changed: hasMeaningfulChange,
    optimizedPrompt: hasMeaningfulChange ? normalizedPrompt : null,
  };
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

const buildDescriptionSummaryPrompt = (data: z.output<typeof descriptionSummarySchema>) => {
  const promptSections = [
    'Return valid JSON in the shape {"summary":"text"}.',
    `Item type: ${data.itemType}`,
    `Title: ${data.title || "N/A"}`,
    `Existing description: ${data.description || "N/A"}`,
    `Language: ${data.language || "N/A"}`,
    `URL: ${data.url || "N/A"}`,
    `URL hostname: ${getUrlHostname(data.url) || "N/A"}`,
    `File name: ${data.fileName || "N/A"}`,
    `File size: ${formatFileSize(data.fileSize) || "N/A"}`,
    `Content (truncated to 4000 chars):\n${truncateSummaryContent(data.content) || "N/A"}`,
  ];

  return promptSections.join("\n\n");
};

const buildExplainCodePrompt = (data: z.output<typeof explainCodeSchema>) => {
  const promptSections = [
    'Return valid JSON in the shape {"explanation":"markdown"}.',
    `Item type: ${data.itemType}`,
    `Title: ${data.title || "N/A"}`,
    `Language: ${data.language || "N/A"}`,
    `Content (truncated to 4000 chars):\n${truncateSummaryContent(data.content)}`,
  ];

  return promptSections.join("\n\n");
};

const buildOptimizePromptInput = (data: z.output<typeof optimizePromptSchema>) => {
  const promptSections = [
    'Return valid JSON in the shape {"changed":boolean,"optimizedPrompt":"text"}.',
    "If the prompt is already clear, specific, and well-structured, set changed to false and optimizedPrompt to an empty string.",
    "If it needs improvement, keep the original intent and output only the refined prompt text in optimizedPrompt.",
    `Title: ${data.title || "N/A"}`,
    `Description: ${data.description || "N/A"}`,
    `Current prompt (truncated to 4000 chars):\n${truncateSummaryContent(data.content)}`,
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

export const generateDescriptionSummary = async (
  data: GenerateDescriptionSummaryPayload,
): Promise<GenerateDescriptionSummaryActionResult> => {
  const parsedPayload = descriptionSummarySchema.safeParse({
    ...data,
    content: data.content?.trim() ?? "",
    description: data.description?.trim() ?? "",
    fileName: data.fileName?.trim() ?? "",
    language: data.language?.trim() ?? "",
    title: data.title?.trim() ?? "",
    url: data.url?.trim() ?? "",
  });

  if (!parsedPayload.success) {
    return {
      success: false,
      error: "Enter a valid item before generating a description.",
    };
  }

  if (
    !parsedPayload.data.title &&
    !parsedPayload.data.description &&
    !parsedPayload.data.content &&
    !parsedPayload.data.url &&
    !parsedPayload.data.fileName
  ) {
    return {
      success: false,
      error: "Add a title, content, URL, or file before generating a description.",
    };
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to generate descriptions.",
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
      error: "Upgrade to Pro to use AI descriptions.",
    };
  }

  const rateLimitResult = await checkAiRateLimit({
    identifier: userId,
    type: "summary",
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
        'You write concise descriptions for developer knowledge items. Return JSON only in the shape {"summary":"text"}. Write 1 to 2 sentences, keep it specific, use the provided item details only, and avoid filler.',
      input: buildDescriptionSummaryPrompt(parsedPayload.data),
      metadata: {
        feature: "description-summary",
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
        error: "Unable to generate a description right now.",
      };
    }

    return {
      success: true,
      data: {
        summary: parseDescriptionSummaryResponse(response.output_text),
      },
    };
  } catch (error) {
    const status = getOpenAIErrorStatus(error);
    const requestId = getOpenAIErrorRequestId(error);

    console.error("Failed to generate description summary.", {
      error,
      feature: "description-summary",
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
      error: "Unable to generate a description right now.",
    };
  }
};

export const explainCode = async (
  data: ExplainCodePayload,
): Promise<ExplainCodeActionResult> => {
  const parsedPayload = explainCodeSchema.safeParse({
    ...data,
    content: data.content?.trim() ?? "",
    language: data.language?.trim() ?? "",
    title: data.title?.trim() ?? "",
  });

  if (!parsedPayload.success) {
    return {
      success: false,
      error: "Add code or a command before requesting an explanation.",
    };
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to explain code.",
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
      error: "Upgrade to Pro to use AI code explanations.",
    };
  }

  const rateLimitResult = await checkAiRateLimit({
    identifier: userId,
    type: "explain",
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
        'You explain developer code and shell commands. Return JSON only in the shape {"explanation":"markdown"}. Write a concise explanation around 200 to 300 words. Cover what it does, how it works, and the key concepts or risks. Use short markdown paragraphs or bullets. Do not invent behavior not supported by the content.',
      input: buildExplainCodePrompt(parsedPayload.data),
      metadata: {
        feature: "explain-code",
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
        error: "Unable to explain this code right now.",
      };
    }

    return {
      success: true,
      data: {
        explanation: parseExplainCodeResponse(response.output_text),
      },
    };
  } catch (error) {
    const status = getOpenAIErrorStatus(error);
    const requestId = getOpenAIErrorRequestId(error);

    console.error("Failed to explain code.", {
      error,
      feature: "explain-code",
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
      error: "Unable to explain this code right now.",
    };
  }
};

export const optimizePrompt = async (
  data: OptimizePromptPayload,
): Promise<OptimizePromptActionResult> => {
  const parsedPayload = optimizePromptSchema.safeParse({
    ...data,
    content: data.content?.trim() ?? "",
    description: data.description?.trim() ?? "",
    title: data.title?.trim() ?? "",
  });

  if (!parsedPayload.success) {
    return {
      success: false,
      error: "Add prompt text before requesting optimization.",
    };
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to optimize prompts.",
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
      error: "Upgrade to Pro to use AI prompt optimization.",
    };
  }

  const rateLimitResult = await checkAiRateLimit({
    identifier: userId,
    type: "optimizePrompt",
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
        'You improve prompts for developer workflows. Return JSON only in the shape {"changed":boolean,"optimizedPrompt":"text"}. Preserve the original intent. Improve clarity, structure, constraints, and output instructions only when needed. If the prompt is already strong, return {"changed":false,"optimizedPrompt":""}.',
      input: buildOptimizePromptInput(parsedPayload.data),
      metadata: {
        feature: "prompt-optimization",
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
        error: "Unable to optimize this prompt right now.",
      };
    }

    return {
      success: true,
      data: parseOptimizePromptResponse(response.output_text, parsedPayload.data.content),
    };
  } catch (error) {
    const status = getOpenAIErrorStatus(error);
    const requestId = getOpenAIErrorRequestId(error);

    console.error("Failed to optimize prompt.", {
      error,
      feature: "prompt-optimization",
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
      error: "Unable to optimize this prompt right now.",
    };
  }
};
