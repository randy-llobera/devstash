import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    itemType: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    collection: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $count: vi.fn(),
  },
}));

vi.mock("@/lib/db/dashboard-user", () => ({
  getDashboardUser: vi.fn(),
}));

import { getGlobalSearchItemPreview, mapGlobalSearchItem } from "@/lib/db/items";

describe("item db helpers", () => {
  it("builds a preview from description, content, url, or file name", () => {
    expect(
      getGlobalSearchItemPreview({
        description: "  Primary preview text  ",
        content: "const x = 1;",
        url: "https://example.com",
        fileName: "script.ts",
      }),
    ).toBe("Primary preview text");

    expect(
      getGlobalSearchItemPreview({
        description: null,
        content: "const value = 1;\nconsole.log(value);",
        url: null,
        fileName: null,
      }),
    ).toBe("const value = 1; console.log(value);");

    expect(
      getGlobalSearchItemPreview({
        description: null,
        content: null,
        url: null,
        fileName: null,
      }),
    ).toBe("No preview available.");
  });

  it("maps a global search item with preview text and keywords", () => {
    const item = mapGlobalSearchItem({
      id: "item-1",
      title: "Deploy command",
      description: null,
      content: "pnpm deploy --prod",
      url: null,
      fileName: null,
      fileSize: null,
      isFavorite: true,
      isPinned: false,
      createdAt: new Date("2026-04-10T08:00:00.000Z"),
      updatedAt: new Date("2026-04-12T10:00:00.000Z"),
      tags: [{ name: "deploy" }, { name: "ops" }],
      itemType: {
        id: "type-command",
        name: "command",
        icon: "Terminal",
        color: "#f97316",
      },
      collections: [
        {
          addedAt: new Date("2026-04-11T09:00:00.000Z"),
          collection: {
            id: "collection-1",
            name: "DevOps",
          },
        },
      ],
    });

    expect(item.description).toBe("pnpm deploy --prod");
    expect(item.collection).toEqual({
      id: "collection-1",
      name: "DevOps",
    });
    expect(item.searchText).toContain("Deploy command");
    expect(item.searchText).toContain("command");
    expect(item.searchText).toContain("pnpm deploy --prod");
    expect(item.searchText).toContain("deploy ops");
    expect(item.searchText).toContain("DevOps");
  });
});
