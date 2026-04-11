import { prisma } from "@/lib/prisma";

export const DASHBOARD_DEMO_USER = {
  email: "demo@devstash.io",
  name: "Demo User",
} as const;

export interface DashboardUser {
  id: string;
  name: string | null;
  email: string;
}

export const getDashboardUser = async (): Promise<DashboardUser | null> => {
  return prisma.user.findUnique({
    where: {
      email: DASHBOARD_DEMO_USER.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
};
