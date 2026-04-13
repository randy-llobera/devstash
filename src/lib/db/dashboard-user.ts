import { cache } from "react";

import { auth } from "@/auth";

export interface DashboardUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export const getDashboardUser = cache(async (): Promise<DashboardUser | null> => {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email,
    image: session.user.image ?? null,
  };
});
