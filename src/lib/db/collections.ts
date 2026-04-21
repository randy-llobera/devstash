import type { DashboardItem } from "@/lib/db/items";

import { prisma } from "@/lib/prisma";
import { getDashboardUser } from "@/lib/db/dashboard-user";

export type DashboardCollectionItemType = {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
};

interface CollectionSummary {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  typeCount: number;
  updatedAt: string;
  dominantTypeColor: string | null;
  itemTypes: DashboardCollectionItemType[];
}

interface SidebarCollectionData {
  favoriteCollections: SidebarCollection[];
  recentCollections: SidebarCollection[];
}

export interface CollectionDetail {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  updatedAt: string;
  dominantTypeColor: string | null;
  itemTypes: DashboardCollectionItemType[];
  items: DashboardItem[];
}

export interface CollectionOption {
  id: string;
  name: string;
}

interface CreateCollectionInput {
  name: string;
  description?: string | null;
}

interface UpdateCollectionInput {
  name: string;
  description?: string | null;
}

export interface DashboardCollection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  typeCount: number;
  updatedAt: string;
  dominantTypeColor: string | null;
  itemTypes: DashboardCollectionItemType[];
}

export interface GlobalSearchCollection {
  id: string;
  name: string;
  itemCount: number;
  itemTypes: DashboardCollectionItemType[];
  searchText: string;
}

export interface SidebarCollection {
  id: string;
  name: string;
  isFavorite: boolean;
  itemCount: number;
  dominantTypeColor: string | null;
}

export interface CreatedCollection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

const collectionSelect = {
  id: true,
  name: true,
  description: true,
  isFavorite: true,
  updatedAt: true,
  items: {
    select: {
      item: {
        select: {
          updatedAt: true,
          itemType: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          },
        },
      },
    },
  },
};

const collectionDetailSelect = {
  id: true,
  name: true,
  description: true,
  isFavorite: true,
  updatedAt: true,
  items: {
    select: {
      addedAt: true,
      item: {
        select: {
          id: true,
          title: true,
          description: true,
          fileName: true,
          fileSize: true,
          isFavorite: true,
          isPinned: true,
          createdAt: true,
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
        },
      },
    },
    orderBy: {
      item: {
        updatedAt: "desc" as const,
      },
    },
  },
};

const mapSidebarCollection = (collection: CollectionSummary): SidebarCollection => ({
  id: collection.id,
  name: collection.name,
  isFavorite: collection.isFavorite,
  itemCount: collection.itemCount,
  dominantTypeColor: collection.dominantTypeColor,
});

export const mapGlobalSearchCollection = (collection: CollectionSummary): GlobalSearchCollection => ({
  id: collection.id,
  name: collection.name,
  itemCount: collection.itemCount,
  itemTypes: collection.itemTypes,
  searchText: [collection.name, collection.description, collection.itemTypes.map((itemType) => itemType.name).join(" ")]
    .filter(Boolean)
    .join(" "),
});

export const buildCollectionSummary = (collection: {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  updatedAt: Date;
  items: {
    item: {
      updatedAt: Date;
      itemType: {
        id: string;
        name: string;
        icon: string;
        color: string;
      };
    };
  }[];
}): CollectionSummary => {
  const itemTypeCounts = new Map<string, DashboardCollectionItemType>();
  let latestUpdatedAt = collection.updatedAt;

  for (const { item } of collection.items) {
    if (item.updatedAt > latestUpdatedAt) {
      latestUpdatedAt = item.updatedAt;
    }

    const existingItemType = itemTypeCounts.get(item.itemType.id);

    if (existingItemType) {
      existingItemType.itemCount += 1;
      continue;
    }

    itemTypeCounts.set(item.itemType.id, {
      id: item.itemType.id,
      name: item.itemType.name,
      icon: item.itemType.icon,
      color: item.itemType.color,
      itemCount: 1,
    });
  }

  const itemTypes = Array.from(itemTypeCounts.values()).sort((left, right) => {
    if (right.itemCount !== left.itemCount) {
      return right.itemCount - left.itemCount;
    }

    return left.name.localeCompare(right.name);
  });

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description ?? "No description yet.",
    isFavorite: collection.isFavorite,
    itemCount: collection.items.length,
    typeCount: itemTypes.length,
    updatedAt: latestUpdatedAt.toISOString(),
    dominantTypeColor: itemTypes[0]?.color ?? null,
    itemTypes,
  };
};

export const mapCollectionDetailItem = (
  collection: {
    id: string;
    name: string;
  },
  item: {
    id: string;
    title: string;
    description: string | null;
    fileName: string | null;
    fileSize: number | null;
    isFavorite: boolean;
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
    tags: { name: string }[];
    itemType: {
      id: string;
      name: string;
      icon: string;
      color: string;
    };
  }
): DashboardItem => ({
  id: item.id,
  title: item.title,
  description: item.description ?? "No description yet.",
  fileName: item.fileName,
  fileSize: item.fileSize,
  isFavorite: item.isFavorite,
  isPinned: item.isPinned,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
  tags: item.tags.map((tag) => tag.name),
  itemType: item.itemType,
  collection,
});

const getCollectionSummariesByUserId = async (
  userId: string,
): Promise<CollectionSummary[]> => {
  const collections = await prisma.collection.findMany({
    where: {
      userId,
    },
    select: collectionSelect,
  });

  return collections
    .map(buildCollectionSummary)
    .sort((left, right) => {
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
};

const getCollectionSummaries = async (): Promise<CollectionSummary[]> => {
  const user = await getDashboardUser();

  if (!user) {
    return [];
  }

  return getCollectionSummariesByUserId(user.id);
};

export const getRecentDashboardCollections = async (
  limit = 6
): Promise<DashboardCollection[]> => {
  const collections = await getCollectionSummaries();

  return collections.slice(0, limit);
};

export const getAllDashboardCollections = async (): Promise<DashboardCollection[]> => {
  return getCollectionSummaries();
};

export const getGlobalSearchCollections = async (
  userId: string,
): Promise<GlobalSearchCollection[]> => {
  const collections = await getCollectionSummariesByUserId(userId);

  return collections.map(mapGlobalSearchCollection);
};

export const getSidebarCollectionsData = async (
  limit = 4
): Promise<SidebarCollectionData> => {
  const collections = await getCollectionSummaries();

  return {
    favoriteCollections: collections
      .filter((collection) => collection.isFavorite)
      .slice(0, limit)
      .map(mapSidebarCollection),
    recentCollections: collections.slice(0, limit).map(mapSidebarCollection),
  };
};

export const getAvailableCollections = async (): Promise<CollectionOption[]> => {
  const user = await getDashboardUser();

  if (!user) {
    return [];
  }

  return prisma.collection.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const getCollectionDetailById = async (
  collectionId: string
): Promise<CollectionDetail | null> => {
  const user = await getDashboardUser();

  if (!user) {
    return null;
  }

  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      userId: user.id,
    },
    select: collectionDetailSelect,
  });

  if (!collection) {
    return null;
  }

  const summary = buildCollectionSummary({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    updatedAt: collection.updatedAt,
    items: collection.items.map(({ item }) => ({
      item: {
        updatedAt: item.updatedAt,
        itemType: item.itemType,
      },
    })),
  });

  return {
    id: collection.id,
    name: summary.name,
    description: summary.description,
    isFavorite: collection.isFavorite,
    itemCount: summary.itemCount,
    updatedAt: summary.updatedAt,
    dominantTypeColor: summary.dominantTypeColor,
    itemTypes: summary.itemTypes,
    items: collection.items.map(({ item }) =>
      mapCollectionDetailItem(
        {
          id: collection.id,
          name: collection.name,
        },
        item
      )
    ),
  };
};

export const createCollection = async (
  userId: string,
  data: CreateCollectionInput
): Promise<CreatedCollection> => {
  const collection = await prisma.collection.create({
    data: {
      userId,
      name: data.name,
      description: data.description ?? null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
};

export const updateCollection = async (
  userId: string,
  collectionId: string,
  data: UpdateCollectionInput
): Promise<CreatedCollection | null> => {
  const existingCollection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!existingCollection) {
    return null;
  }

  const collection = await prisma.collection.update({
    where: {
      id: collectionId,
    },
    data: {
      name: data.name,
      description: data.description ?? null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
};

export const deleteCollection = async (
  userId: string,
  collectionId: string
): Promise<boolean> => {
  return prisma.$transaction(async (tx) => {
    const existingCollection = await tx.collection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!existingCollection) {
      return false;
    }

    await tx.itemCollection.deleteMany({
      where: {
        collectionId,
      },
    });

    await tx.collection.delete({
      where: {
        id: collectionId,
      },
    });

    return true;
  });
};
