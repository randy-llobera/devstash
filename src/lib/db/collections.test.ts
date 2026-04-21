import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  collectionDeleteMock,
  collectionFindFirstMock,
  collectionUpdateMock,
  itemCollectionDeleteManyMock,
  prismaTransactionMock,
} = vi.hoisted(() => ({
  collectionDeleteMock: vi.fn(),
  collectionFindFirstMock: vi.fn(),
  collectionUpdateMock: vi.fn(),
  itemCollectionDeleteManyMock: vi.fn(),
  prismaTransactionMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      findFirst: collectionFindFirstMock,
      update: collectionUpdateMock,
      delete: collectionDeleteMock,
    },
    itemCollection: {
      deleteMany: itemCollectionDeleteManyMock,
    },
    $transaction: prismaTransactionMock,
  },
}));

vi.mock("@/lib/db/dashboard-user", () => ({
  getDashboardUser: vi.fn(),
}));

import {
  buildCollectionSummary,
  deleteCollection,
  mapGlobalSearchCollection,
  mapCollectionDetailItem,
  updateCollection,
} from "@/lib/db/collections";

describe("collection db helpers", () => {
  beforeEach(() => {
    collectionDeleteMock.mockReset();
    collectionFindFirstMock.mockReset();
    collectionUpdateMock.mockReset();
    itemCollectionDeleteManyMock.mockReset();
    prismaTransactionMock.mockReset();
  });

  it("builds a summary with type counts, latest update, and fallback description", () => {
    const summary = buildCollectionSummary({
      id: "collection-1",
      name: "DevOps",
      description: null,
      isFavorite: true,
      updatedAt: new Date("2026-04-10T08:00:00.000Z"),
      items: [
        {
          item: {
            updatedAt: new Date("2026-04-12T10:00:00.000Z"),
            itemType: {
              id: "type-command",
              name: "command",
              icon: "Terminal",
              color: "#f97316",
            },
          },
        },
        {
          item: {
            updatedAt: new Date("2026-04-11T09:00:00.000Z"),
            itemType: {
              id: "type-link",
              name: "link",
              icon: "Link",
              color: "#10b981",
            },
          },
        },
        {
          item: {
            updatedAt: new Date("2026-04-11T11:00:00.000Z"),
            itemType: {
              id: "type-command",
              name: "command",
              icon: "Terminal",
              color: "#f97316",
            },
          },
        },
      ],
    });

    expect(summary).toEqual({
      id: "collection-1",
      name: "DevOps",
      description: "No description yet.",
      isFavorite: true,
      itemCount: 3,
      typeCount: 2,
      updatedAt: "2026-04-12T10:00:00.000Z",
      dominantTypeColor: "#f97316",
      itemTypes: [
        {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
          itemCount: 2,
        },
        {
          id: "type-link",
          name: "link",
          icon: "Link",
          color: "#10b981",
          itemCount: 1,
        },
      ],
    });
  });

  it("sorts equally common types by name", () => {
    const summary = buildCollectionSummary({
      id: "collection-2",
      name: "Frontend",
      description: "UI patterns",
      isFavorite: false,
      updatedAt: new Date("2026-04-10T08:00:00.000Z"),
      items: [
        {
          item: {
            updatedAt: new Date("2026-04-10T08:00:00.000Z"),
            itemType: {
              id: "type-snippet",
              name: "snippet",
              icon: "Code",
              color: "#3b82f6",
            },
          },
        },
        {
          item: {
            updatedAt: new Date("2026-04-10T08:00:00.000Z"),
            itemType: {
              id: "type-note",
              name: "note",
              icon: "StickyNote",
              color: "#fde047",
            },
          },
        },
      ],
    });

    expect(summary.itemTypes.map((itemType) => itemType.name)).toEqual(["note", "snippet"]);
    expect(summary.dominantTypeColor).toBe("#fde047");
  });

  it("maps a collection detail item into the dashboard item shape", () => {
    const item = mapCollectionDetailItem(
      {
        id: "collection-1",
        name: "DevOps",
      },
      {
        id: "item-1",
        title: "Deploy to Production",
        description: null,
        fileName: "deploy.sh",
        fileSize: 2048,
        isFavorite: true,
        isPinned: false,
        createdAt: new Date("2026-04-10T08:00:00.000Z"),
        updatedAt: new Date("2026-04-12T10:00:00.000Z"),
        tags: [{ name: "ci" }, { name: "deploy" }],
        itemType: {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
        },
      }
    );

    expect(item).toEqual({
      id: "item-1",
      title: "Deploy to Production",
      description: "No description yet.",
      fileName: "deploy.sh",
      fileSize: 2048,
      isFavorite: true,
      isPinned: false,
      createdAt: "2026-04-10T08:00:00.000Z",
      updatedAt: "2026-04-12T10:00:00.000Z",
      tags: ["ci", "deploy"],
      itemType: {
        id: "type-command",
        name: "command",
        icon: "Terminal",
        color: "#f97316",
      },
      collection: {
        id: "collection-1",
        name: "DevOps",
      },
    });
  });

  it("maps a global search collection with keywords and counts", () => {
    const collection = mapGlobalSearchCollection({
      id: "collection-1",
      name: "DevOps",
      description: "Deployment commands",
      isFavorite: false,
      itemCount: 3,
      typeCount: 2,
      updatedAt: "2026-04-12T10:00:00.000Z",
      dominantTypeColor: "#f97316",
      itemTypes: [
        {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
          itemCount: 2,
        },
        {
          id: "type-link",
          name: "link",
          icon: "Link",
          color: "#10b981",
          itemCount: 1,
        },
      ],
    });

    expect(collection).toEqual({
      id: "collection-1",
      name: "DevOps",
      itemCount: 3,
      itemTypes: [
        {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
          itemCount: 2,
        },
        {
          id: "type-link",
          name: "link",
          icon: "Link",
          color: "#10b981",
          itemCount: 1,
        },
      ],
      searchText: "DevOps Deployment commands command link",
    });
  });

  it("updates an owned collection", async () => {
    collectionFindFirstMock.mockResolvedValue({
      id: "collection-1",
    });
    collectionUpdateMock.mockResolvedValue({
      id: "collection-1",
      name: "Frontend",
      description: "UI patterns",
      isFavorite: false,
      createdAt: new Date("2026-04-10T08:00:00.000Z"),
      updatedAt: new Date("2026-04-12T10:00:00.000Z"),
    });

    const result = await updateCollection("user-1", "collection-1", {
      name: "Frontend",
      description: "UI patterns",
    });

    expect(collectionFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: "collection-1",
        userId: "user-1",
      },
      select: {
        id: true,
      },
    });
    expect(collectionUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "collection-1",
      },
      data: {
        name: "Frontend",
        description: "UI patterns",
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
    expect(result).toEqual({
      id: "collection-1",
      name: "Frontend",
      description: "UI patterns",
      isFavorite: false,
      createdAt: "2026-04-10T08:00:00.000Z",
      updatedAt: "2026-04-12T10:00:00.000Z",
    });
  });

  it("does not update a collection the user does not own", async () => {
    collectionFindFirstMock.mockResolvedValue(null);

    const result = await updateCollection("user-1", "collection-1", {
      name: "Frontend",
      description: null,
    });

    expect(collectionUpdateMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("deletes join rows before deleting an owned collection", async () => {
    prismaTransactionMock.mockImplementation(async (callback) =>
      callback({
        collection: {
          findFirst: collectionFindFirstMock,
          delete: collectionDeleteMock,
        },
        itemCollection: {
          deleteMany: itemCollectionDeleteManyMock,
        },
      }),
    );
    collectionFindFirstMock.mockResolvedValue({
      id: "collection-1",
    });

    const result = await deleteCollection("user-1", "collection-1");

    expect(itemCollectionDeleteManyMock).toHaveBeenCalledWith({
      where: {
        collectionId: "collection-1",
      },
    });
    expect(collectionDeleteMock).toHaveBeenCalledWith({
      where: {
        id: "collection-1",
      },
    });
    expect(result).toBe(true);
  });

  it("does not delete when the collection is not owned by the user", async () => {
    prismaTransactionMock.mockImplementation(async (callback) =>
      callback({
        collection: {
          findFirst: collectionFindFirstMock,
          delete: collectionDeleteMock,
        },
        itemCollection: {
          deleteMany: itemCollectionDeleteManyMock,
        },
      }),
    );
    collectionFindFirstMock.mockResolvedValue(null);

    const result = await deleteCollection("user-1", "collection-1");

    expect(itemCollectionDeleteManyMock).not.toHaveBeenCalled();
    expect(collectionDeleteMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
