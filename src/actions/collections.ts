"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createCollection as createCollectionRecord,
  deleteCollection as deleteCollectionRecord,
  updateCollection as updateCollectionRecord,
} from "@/lib/db/collections";

const collectionCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required."),
  description: z
    .string()
    .trim()
    .nullable()
    .optional(),
});

type CreateCollectionPayload = z.input<typeof collectionCreateSchema>;
type UpdateCollectionPayload = z.input<typeof collectionCreateSchema>;

export interface CreateCollectionActionError {
  message: string;
  fieldErrors?: Partial<Record<keyof CreateCollectionPayload, string[]>>;
}

export interface UpdateCollectionActionError {
  message: string;
  fieldErrors?: Partial<Record<keyof UpdateCollectionPayload, string[]>>;
}

interface CreateCollectionActionResult {
  success: boolean;
  data?: Awaited<ReturnType<typeof createCollectionRecord>>;
  error?: CreateCollectionActionError | string;
}

interface UpdateCollectionActionResult {
  success: boolean;
  data?: Awaited<ReturnType<typeof updateCollectionRecord>>;
  error?: UpdateCollectionActionError | string;
}

interface DeleteCollectionActionResult {
  success: boolean;
  error?: string;
}

const VALIDATION_ERROR_MESSAGE = "Please fix the highlighted fields.";

const normalizeOptionalText = (value: string | null | undefined) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

const buildCreateCollectionPayload = (data: CreateCollectionPayload) => ({
  name: data.name,
  ...(Object.prototype.hasOwnProperty.call(data, "description")
    ? { description: normalizeOptionalText(data.description) }
    : {}),
});

const getFieldValidationError = (
  error: z.ZodError<CreateCollectionPayload>,
): CreateCollectionActionError => ({
  message: VALIDATION_ERROR_MESSAGE,
  fieldErrors: error.flatten().fieldErrors,
});

const getSessionUserId = async () => {
  const session = await auth();

  return session?.user?.id ?? null;
};

export const createCollection = async (
  data: CreateCollectionPayload,
): Promise<CreateCollectionActionResult> => {
  const parsedPayload = collectionCreateSchema.safeParse(
    buildCreateCollectionPayload(data),
  );

  if (!parsedPayload.success) {
    return {
      success: false,
      error: getFieldValidationError(parsedPayload.error),
    };
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to create collections.",
    };
  }

  try {
    const createdCollection = await createCollectionRecord(userId, parsedPayload.data);

    return {
      success: true,
      data: createdCollection,
    };
  } catch (error) {
    console.error("Failed to create collection.", error);

    return {
      success: false,
      error: "Unable to create collection.",
    };
  }
};

export const updateCollection = async (
  collectionId: string,
  data: UpdateCollectionPayload,
): Promise<UpdateCollectionActionResult> => {
  const parsedPayload = collectionCreateSchema.safeParse(
    buildCreateCollectionPayload(data),
  );

  if (!parsedPayload.success) {
    return {
      success: false,
      error: getFieldValidationError(parsedPayload.error),
    };
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to update collections.",
    };
  }

  try {
    const updatedCollection = await updateCollectionRecord(
      userId,
      collectionId,
      parsedPayload.data,
    );

    if (!updatedCollection) {
      return {
        success: false,
        error: "Collection not found.",
      };
    }

    return {
      success: true,
      data: updatedCollection,
    };
  } catch (error) {
    console.error("Failed to update collection.", error);

    return {
      success: false,
      error: "Unable to update collection.",
    };
  }
};

export const deleteCollection = async (
  collectionId: string,
): Promise<DeleteCollectionActionResult> => {
  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to delete collections.",
    };
  }

  try {
    const deletedCollection = await deleteCollectionRecord(userId, collectionId);

    if (!deletedCollection) {
      return {
        success: false,
        error: "Collection not found.",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete collection.", error);

    return {
      success: false,
      error: "Unable to delete collection.",
    };
  }
};
