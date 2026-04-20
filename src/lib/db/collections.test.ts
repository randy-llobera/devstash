import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("@/lib/db/dashboard-user", () => ({
  getDashboardUser: vi.fn(),
}));

import { buildCollectionSummary, mapCollectionDetailItem } from "@/lib/db/collections";

describe("collection db helpers", () => {
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
});
