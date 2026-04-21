"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  editorPreferencesPatchSchema,
  mergeEditorPreferences,
  type EditorPreferences,
  type EditorPreferencesPatch,
} from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";

interface UpdateEditorPreferencesActionResult {
  success: boolean;
  data?: EditorPreferences;
  error?: string;
}

const getSessionUserId = async () => {
  const session = await auth();

  return session?.user?.id ?? null;
};

export const updateEditorPreferences = async (
  patch: EditorPreferencesPatch,
): Promise<UpdateEditorPreferencesActionResult> => {
  const parsedPatch = editorPreferencesPatchSchema.safeParse(patch);

  if (!parsedPatch.success) {
    return {
      success: false,
      error: "Editor preferences payload is invalid.",
    };
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to update editor preferences.",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        editorPreferences: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found.",
      };
    }

    const nextPreferences = mergeEditorPreferences(
      user.editorPreferences,
      parsedPatch.data,
    );

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        editorPreferences: nextPreferences,
      },
    });

    return {
      success: true,
      data: nextPreferences,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Editor preferences payload is invalid.",
      };
    }

    console.error("Failed to update editor preferences.", error);

    return {
      success: false,
      error: "Unable to update editor preferences.",
    };
  }
};
