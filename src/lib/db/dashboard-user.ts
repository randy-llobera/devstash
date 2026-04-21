import { cache } from "react";

import { auth } from "@/auth";
import {
  normalizeEditorPreferences,
  type EditorPreferences,
} from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";

export interface DashboardUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  hasPassword: boolean;
  editorPreferences: EditorPreferences;
}

export const getDashboardUser = cache(async (): Promise<DashboardUser | null> => {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true,
      editorPreferences: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt.toISOString(),
    hasPassword: Boolean(user.password),
    editorPreferences: normalizeEditorPreferences(user.editorPreferences),
  };
});
