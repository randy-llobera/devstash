"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { deleteR2Object } from "@/lib/r2";
import { getObjectKeyFromFileUrl } from "@/lib/file-upload";
import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  getItemDrawerDetail,
  updateItem as updateItemRecord,
} from "@/lib/db/items";

const createItemTypeSchema = z.enum([
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
]);

const itemCreateSchema = z
  .object({
    itemType: createItemTypeSchema,
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
    fileName: z
      .string()
      .trim()
      .min(1, "File name is required.")
      .nullable()
      .optional(),
    fileSize: z
      .number()
      .int()
      .positive("File size is required.")
      .nullable()
      .optional(),
    fileUrl: z
      .string()
      .trim()
      .url("Enter a valid file URL.")
      .nullable()
      .optional(),
    tags: z
      .array(z.string().trim().min(1, "Tags cannot be empty."))
      .transform((tags) => Array.from(new Set(tags))),
  })
  .superRefine((value, context) => {
    if (value.itemType === "link" && !value.url) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "URL is required for links.",
      });
    }

    if ((value.itemType === "file" || value.itemType === "image") && !value.fileUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileUrl"],
        message: "A file upload is required.",
      });
    }

    if ((value.itemType === "file" || value.itemType === "image") && !value.fileName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileName"],
        message: "File name is required.",
      });
    }

    if ((value.itemType === "file" || value.itemType === "image") && !value.fileSize) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileSize"],
        message: "File size is required.",
      });
    }
  });

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
type CreateItemPayload = z.input<typeof itemCreateSchema>;

export interface UpdateItemActionError {
  message: string;
  fieldErrors?: Partial<Record<keyof UpdateItemPayload, string[]>>;
}

export interface CreateItemActionError {
  message: string;
  fieldErrors?: Partial<Record<keyof CreateItemPayload, string[]>>;
}

interface UpdateItemActionResult {
  success: boolean;
  data?: Awaited<ReturnType<typeof updateItemRecord>>;
  error?: UpdateItemActionError | string;
}

interface CreateItemActionResult {
  success: boolean;
  data?: Awaited<ReturnType<typeof createItemRecord>>;
  error?: CreateItemActionError | string;
}

interface DeleteItemActionResult {
  success: boolean;
  error?: string;
}

const normalizeOptionalText = (value: string | null | undefined) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

export const createItem = async (data: CreateItemPayload): Promise<CreateItemActionResult> => {
  const parsedPayload = itemCreateSchema.safeParse({
    itemType: data.itemType,
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
    ...(Object.prototype.hasOwnProperty.call(data, "fileName")
      ? { fileName: normalizeOptionalText(data.fileName) }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "fileSize")
      ? { fileSize: data.fileSize ?? null }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "fileUrl")
      ? { fileUrl: normalizeOptionalText(data.fileUrl) }
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
      error: "You must be signed in to create items.",
    };
  }

  if (
    (parsedPayload.data.itemType === "file" || parsedPayload.data.itemType === "image") &&
    parsedPayload.data.fileUrl
  ) {
    const objectKey = getObjectKeyFromFileUrl(parsedPayload.data.fileUrl);

    if (!objectKey || !objectKey.startsWith(`users/${session.user.id}/`)) {
      return {
        success: false,
        error: {
          message: "Please fix the highlighted fields.",
          fieldErrors: {
            fileUrl: ["Uploaded file must belong to your storage bucket."],
          },
        },
      };
    }
  }

  try {
    const createdItem = await createItemRecord(session.user.id, parsedPayload.data);

    if (!createdItem) {
      return {
        success: false,
        error: "Invalid item type.",
      };
    }

    return {
      success: true,
      data: createdItem,
    };
  } catch (error) {
    console.error("Failed to create item.", error);

    return {
      success: false,
      error: "Unable to create item.",
    };
  }
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

export const deleteItem = async (itemId: string): Promise<DeleteItemActionResult> => {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in to delete items.",
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
    if (existingItem.fileUrl) {
      const objectKey = getObjectKeyFromFileUrl(existingItem.fileUrl);

      if (objectKey) {
        await deleteR2Object(objectKey);
      }
    }

    const deleted = await deleteItemRecord(itemId, session.user.id);

    if (!deleted) {
      return {
        success: false,
        error: "Item not found.",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete item.", error);

    return {
      success: false,
      error: "Unable to delete item.",
    };
  }
};
