import { prisma } from "@/lib/prisma";
import { DASHBOARD_DEMO_USER } from "@/lib/db/dashboard-user";

type DashboardItemCollection = {
  id: string;
  name: string;
};

type DashboardItemType = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export interface DashboardItem {
  id: string;
  title: string;
  description: string;
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: string;
  tags: string[];
  itemType: DashboardItemType;
  collection: DashboardItemCollection | null;
}

const getDashboardUser = async () => {
  return prisma.user.findUnique({
    where: {
      email: DASHBOARD_DEMO_USER.email,
    },
    select: {
      id: true,
    },
  });
};

const mapDashboardItem = (item: {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: Date;
  tags: { name: string }[];
  itemType: DashboardItemType;
  collections: {
    addedAt: Date;
    collection: DashboardItemCollection;
  }[];
}): DashboardItem => {
  const [primaryCollection] = [...item.collections].sort(
    (left, right) => left.addedAt.getTime() - right.addedAt.getTime()
  );

  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "No description yet.",
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    updatedAt: item.updatedAt.toISOString(),
    tags: item.tags.map((tag) => tag.name),
    itemType: item.itemType,
    collection: primaryCollection?.collection ?? null,
  };
};

const getDashboardItems = async () => {
  const user = await getDashboardUser();

  if (!user) {
    return [];
  }

  return prisma.item.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      isFavorite: true,
      isPinned: true,
      updatedAt: true,
      tags: {
        select: {
          name: true,
        },
      },
      itemType: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
      collections: {
        select: {
          addedAt: true,
          collection: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
};

export const getPinnedDashboardItems = async (): Promise<DashboardItem[]> => {
  const items = await getDashboardItems();

  return items.filter((item) => item.isPinned).map(mapDashboardItem);
};

export const getRecentDashboardItems = async (
  limit = 10
): Promise<DashboardItem[]> => {
  const items = await getDashboardItems();

  return items.slice(0, limit).map(mapDashboardItem);
};
