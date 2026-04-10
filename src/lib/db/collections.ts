import { prisma } from "@/lib/prisma";

type DashboardCollectionItemType = {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
};

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

const getLatestUpdatedAt = (
  collectionUpdatedAt: Date,
  itemDates: Date[]
): string => {
  const latestItemDate = itemDates.sort(
    (left, right) => right.getTime() - left.getTime()
  )[0];

  return (latestItemDate ?? collectionUpdatedAt).toISOString();
};

export const getRecentDashboardCollections = async (): Promise<
  DashboardCollection[]
> => {
  const user = await prisma.user.findFirst({
    where: {
      collections: {
        some: {
          items: {
            some: {},
          },
        },
      },
    },
    select: {
      id: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!user) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: {
      userId: user.id,
      items: {
        some: {},
      },
    },
    select: {
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
    },
  });

  return collections
    .map((collection) => {
      const itemTypeCounts = new Map<string, DashboardCollectionItemType>();
      const itemDates = collection.items.map(({ item }) => item.updatedAt);

      for (const { item } of collection.items) {
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
        updatedAt: getLatestUpdatedAt(collection.updatedAt, itemDates),
        dominantTypeColor: itemTypes[0]?.color ?? null,
        itemTypes,
      };
    })
    .sort((left, right) => {
      return (
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      );
    })
    .slice(0, 6);
};
