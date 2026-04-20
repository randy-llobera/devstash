import { prisma } from "@/lib/prisma";
import { getDashboardUser } from "@/lib/db/dashboard-user";

type DashboardCollectionItemType = {
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

interface CreateCollectionInput {
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

const buildCollectionSummary = (collection: {
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

const getCollectionSummaries = async (): Promise<CollectionSummary[]> => {
  const user = await getDashboardUser();

  if (!user) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: {
      userId: user.id,
    },
    select: collectionSelect,
  });

  return collections
    .map(buildCollectionSummary)
    .sort((left, right) => {
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
};

export const getRecentDashboardCollections = async (
  limit = 6
): Promise<DashboardCollection[]> => {
  const collections = await getCollectionSummaries();

  return collections.slice(0, limit);
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
