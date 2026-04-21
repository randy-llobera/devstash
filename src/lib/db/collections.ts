import type { DashboardItem } from "@/lib/db/items";

import { prisma } from "@/lib/prisma";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import {
  COLLECTIONS_PER_PAGE,
  DASHBOARD_COLLECTIONS_LIMIT,
  getPaginationState,
  type PaginationState,
} from "@/lib/pagination";

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
  pagination: PaginationState;
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
  limit = DASHBOARD_COLLECTIONS_LIMIT
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
  collectionId: string,
  page = 1,
  perPage = COLLECTIONS_PER_PAGE,
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
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      updatedAt: true,
    },
  });

  if (!collection) {
    return null;
  }

  const itemWhere = {
    userId: user.id,
    collections: {
      some: {
        collectionId,
      },
    },
  };

  const [itemCount, latestItem, itemTypeCounts] = await Promise.all([
    prisma.item.count({
      where: itemWhere,
    }),
    prisma.item.findFirst({
      where: itemWhere,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        updatedAt: true,
      },
    }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: itemWhere,
      _count: {
        _all: true,
      },
      orderBy: {
        itemTypeId: "asc",
      },
    }),
  ]);

  const pagination = getPaginationState({
    currentPage: page,
    perPage,
    totalItems: itemCount,
  });
  const pagedCollectionItems = await prisma.item.findMany({
    where: itemWhere,
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
    skip: pagination.offset,
    take: pagination.perPage,
    orderBy: {
      updatedAt: "desc",
    },
  });
  const itemTypes = itemTypeCounts.length > 0
    ? await prisma.itemType.findMany({
      where: {
        id: {
          in: itemTypeCounts.map((itemTypeCount) => itemTypeCount.itemTypeId),
        },
      },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
      },
    })
    : [];
  const itemTypeLookup = new Map(itemTypes.map((itemType) => [itemType.id, itemType]));
  const summaryItemTypes = itemTypeCounts
    .map((itemTypeCount) => {
      const itemType = itemTypeLookup.get(itemTypeCount.itemTypeId);

      if (!itemType) {
        return null;
      }

      return {
        id: itemType.id,
        name: itemType.name,
        icon: itemType.icon,
        color: itemType.color,
        itemCount: itemTypeCount._count._all,
      };
    })
    .filter((itemType): itemType is DashboardCollectionItemType => itemType !== null)
    .sort((left, right) => {
      if (right.itemCount !== left.itemCount) {
        return right.itemCount - left.itemCount;
      }

      return left.name.localeCompare(right.name);
    });
  const updatedAt = latestItem && latestItem.updatedAt > collection.updatedAt
    ? latestItem.updatedAt.toISOString()
    : collection.updatedAt.toISOString();

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description ?? "No description yet.",
    isFavorite: collection.isFavorite,
    itemCount,
    updatedAt,
    dominantTypeColor: summaryItemTypes[0]?.color ?? null,
    itemTypes: summaryItemTypes,
    items: pagedCollectionItems.map((item) =>
      mapCollectionDetailItem(
        {
          id: collection.id,
          name: collection.name,
        },
        item
      )
    ),
    pagination,
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
