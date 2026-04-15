import { prisma } from "@/lib/prisma";
import { getDashboardUser } from "@/lib/db/dashboard-user";

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

export interface ItemTypeSummary {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export interface ItemsByTypeResult {
  itemType: ItemTypeSummary;
  items: DashboardItem[];
}

export interface DashboardStats {
  itemCount: number;
  collectionCount: number;
  favoriteItemCount: number;
  favoriteCollectionCount: number;
}

export interface SidebarItemType {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  count: number;
}

const capitalize = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
export const getItemTypeSlug = (name: string) => `${name.toLowerCase()}s`;
export const getItemTypeLabel = (name: string) => `${capitalize(name)}s`;

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

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const user = await getDashboardUser();

  if (!user) {
    return {
      itemCount: 0,
      collectionCount: 0,
      favoriteItemCount: 0,
      favoriteCollectionCount: 0,
    };
  }

  const [itemCount, collectionCount, favoriteItemCount, favoriteCollectionCount] =
    await Promise.all([
      prisma.item.count({
        where: {
          userId: user.id,
        },
      }),
      prisma.collection.count({
        where: {
          userId: user.id,
        },
      }),
      prisma.item.count({
        where: {
          userId: user.id,
          isFavorite: true,
        },
      }),
      prisma.collection.count({
        where: {
          userId: user.id,
          isFavorite: true,
        },
      }),
    ]);

  return {
    itemCount,
    collectionCount,
    favoriteItemCount,
    favoriteCollectionCount,
  };
};

const SIDEBAR_ITEM_TYPE_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
] as const;

export const getSidebarItemTypes = async (): Promise<SidebarItemType[]> => {
  const user = await getDashboardUser();

  const itemTypes = await prisma.itemType.findMany({
    where: {
      isSystem: true,
    },
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
      _count: {
        select: {
          items: user
            ? {
                where: {
                  userId: user.id,
                },
              }
            : true,
        },
      },
    },
  });

  return itemTypes
    .sort((left, right) => {
      const leftIndex = SIDEBAR_ITEM_TYPE_ORDER.indexOf(
        left.name as (typeof SIDEBAR_ITEM_TYPE_ORDER)[number]
      );
      const rightIndex = SIDEBAR_ITEM_TYPE_ORDER.indexOf(
        right.name as (typeof SIDEBAR_ITEM_TYPE_ORDER)[number]
      );

      if (leftIndex === -1 || rightIndex === -1) {
        return left.name.localeCompare(right.name);
      }

      return leftIndex - rightIndex;
    })
    .map((itemType) => ({
      id: itemType.id,
      name: getItemTypeLabel(itemType.name),
      slug: getItemTypeSlug(itemType.name),
      icon: itemType.icon,
      color: itemType.color,
      count: user ? itemType._count.items : 0,
    }));
};

export const getItemsByTypeSlug = async (
  slug: string
): Promise<ItemsByTypeResult | null> => {
  const user = await getDashboardUser();

  if (!user) {
    return null;
  }

  const itemTypes = await prisma.itemType.findMany({
    where: {
      isSystem: true,
    },
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
    },
  });

  const matchedItemType = itemTypes.find((itemType) => getItemTypeSlug(itemType.name) === slug);

  if (!matchedItemType) {
    return null;
  }

  const items = await prisma.item.findMany({
    where: {
      userId: user.id,
      itemTypeId: matchedItemType.id,
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

  return {
    itemType: {
      ...matchedItemType,
      slug,
    },
    items: items.map(mapDashboardItem),
  };
};
