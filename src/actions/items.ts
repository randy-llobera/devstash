"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { getItemDrawerDetail, updateItem as updateItemRecord } from "@/lib/db/items";

const itemUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required."),
  description: z
    .string()
    .trim()
    .nullable()
    .optional(),
  content: z
    .string()
    .trim()
    .nullable()
    .optional(),
  url: z
    .string()
    .trim()
    .url("Enter a valid URL.")
    .nullable()
    .optional(),
  language: z
    .string()
    .trim()
    .nullable()
    .optional(),
  tags: z
    .array(z.string().trim().min(1, "Tags cannot be empty."))
    .transform((tags) => Array.from(new Set(tags))),
});

type UpdateItemPayload = z.input<typeof itemUpdateSchema>;

export interface UpdateItemActionError {
  message: string;
  fieldErrors?: Partial<Record<keyof UpdateItemPayload, string[]>>;
}

interface UpdateItemActionResult {
  success: boolean;
  data?: Awaited<ReturnType<typeof updateItemRecord>>;
  error?: UpdateItemActionError | string;
}

const normalizeOptionalText = (value: string | null | undefined) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

export const updateItem = async (
  itemId: string,
  data: UpdateItemPayload
): Promise<UpdateItemActionResult> => {
  const parsedPayload = itemUpdateSchema.safeParse({
    title: data.title,
    tags: data.tags,
    ...(Object.prototype.hasOwnProperty.call(data, "description")
      ? { description: normalizeOptionalText(data.description) }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "content")
      ? { content: normalizeOptionalText(data.content) }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "url")
      ? { url: normalizeOptionalText(data.url) }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "language")
      ? { language: normalizeOptionalText(data.language) }
      : {}),
  });

  if (!parsedPayload.success) {
    const flattenedError = parsedPayload.error.flatten();

    return {
      success: false,
      error: {
        message: "Please fix the highlighted fields.",
        fieldErrors: flattenedError.fieldErrors,
      },
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in to update items.",
    };
  }

  const existingItem = await getItemDrawerDetail(itemId, session.user.id);

  if (!existingItem) {
    return {
      success: false,
      error: "Item not found.",
    };
  }

  try {
    const updatedItem = await updateItemRecord(itemId, parsedPayload.data);

    if (!updatedItem) {
      return {
        success: false,
        error: "Item not found.",
      };
    }

    return {
      success: true,
      data: updatedItem,
    };
  } catch (error) {
    console.error("Failed to update item.", error);

    return {
      success: false,
      error: "Unable to update item.",
    };
  }
};
