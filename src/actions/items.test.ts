import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  createItemRecordMock,
  deleteItemRecordMock,
  getItemDrawerDetailMock,
  updateItemRecordMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  createItemRecordMock: vi.fn(),
  deleteItemRecordMock: vi.fn(),
  getItemDrawerDetailMock: vi.fn(),
  updateItemRecordMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  createItem: createItemRecordMock,
  deleteItem: deleteItemRecordMock,
  getItemDrawerDetail: getItemDrawerDetailMock,
  updateItem: updateItemRecordMock,
}));

import { createItem, deleteItem, updateItem } from "@/actions/items";

describe("createItem action", () => {
  beforeEach(() => {
    authMock.mockReset();
    createItemRecordMock.mockReset();
    deleteItemRecordMock.mockReset();
    getItemDrawerDetailMock.mockReset();
    updateItemRecordMock.mockReset();
  });

  it("rejects unauthenticated create requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await createItem({
      itemType: "snippet",
      title: "New item",
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to create items.",
    });
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid payloads", async () => {
    const result = await createItem({
      itemType: "link",
      title: "   ",
      url: "not-a-url",
      tags: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toEqual({
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        title: ["Title is required."],
        url: ["Enter a valid URL."],
      },
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("normalizes optional values and deduplicates tags before creating", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    createItemRecordMock.mockResolvedValue({
      id: "item-1",
      title: "New item",
    });

    const result = await createItem({
      itemType: "command",
      title: "  New item  ",
      description: "   ",
      content: "  npm run lint  ",
      language: "  Bash  ",
      tags: ["react", "react", " prisma "],
    });

    expect(createItemRecordMock).toHaveBeenCalledWith("user-1", {
      itemType: "command",
      title: "New item",
      description: null,
      content: "npm run lint",
      language: "Bash",
      tags: ["react", "prisma"],
    });
    expect(result).toEqual({
      success: true,
      data: {
        id: "item-1",
        title: "New item",
      },
    });
  });

  it("returns a generic error when create fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    createItemRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await createItem({
      itemType: "note",
      title: "New item",
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to create item.",
    });
  });
});

describe("updateItem action", () => {
  beforeEach(() => {
    authMock.mockReset();
    createItemRecordMock.mockReset();
    deleteItemRecordMock.mockReset();
    getItemDrawerDetailMock.mockReset();
    updateItemRecordMock.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await updateItem("item-1", {
      title: "Updated title",
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to update items.",
    });
    expect(getItemDrawerDetailMock).not.toHaveBeenCalled();
    expect(updateItemRecordMock).not.toHaveBeenCalled();
  });

  it("returns an error when the item does not belong to the user", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue(null);

    const result = await updateItem("item-1", {
      title: "Updated title",
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: "Item not found.",
    });
    expect(updateItemRecordMock).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid payloads", async () => {
    const result = await updateItem("item-1", {
      title: "   ",
      url: "not-a-url",
      tags: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toEqual({
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        title: ["Title is required."],
        url: ["Enter a valid URL."],
      },
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(getItemDrawerDetailMock).not.toHaveBeenCalled();
    expect(updateItemRecordMock).not.toHaveBeenCalled();
  });

  it("normalizes optional values and deduplicates tags before updating", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue({
      id: "item-1",
    });
    updateItemRecordMock.mockResolvedValue({
      id: "item-1",
      title: "Updated title",
    });

    const result = await updateItem("item-1", {
      title: "  Updated title  ",
      description: "   ",
      content: "  console.log('hi')  ",
      language: "  TypeScript  ",
      url: "  https://example.com/docs  ",
      tags: ["react", "react", " prisma "],
    });

    expect(updateItemRecordMock).toHaveBeenCalledWith("item-1", {
      title: "Updated title",
      description: null,
      content: "console.log('hi')",
      language: "TypeScript",
      url: "https://example.com/docs",
      tags: ["react", "prisma"],
    });
    expect(result).toEqual({
      success: true,
      data: {
        id: "item-1",
        title: "Updated title",
      },
    });
  });

  it("returns a generic error when the update fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue({
      id: "item-1",
    });
    updateItemRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await updateItem("item-1", {
      title: "Updated title",
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to update item.",
    });
  });
});

describe("deleteItem action", () => {
  beforeEach(() => {
    authMock.mockReset();
    createItemRecordMock.mockReset();
    deleteItemRecordMock.mockReset();
    getItemDrawerDetailMock.mockReset();
    updateItemRecordMock.mockReset();
  });

  it("rejects unauthenticated delete requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to delete items.",
    });
    expect(getItemDrawerDetailMock).not.toHaveBeenCalled();
    expect(deleteItemRecordMock).not.toHaveBeenCalled();
  });

  it("returns an error when the item does not belong to the user", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "Item not found.",
    });
    expect(deleteItemRecordMock).not.toHaveBeenCalled();
  });

  it("deletes the item when the user owns it", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue({
      id: "item-1",
    });
    deleteItemRecordMock.mockResolvedValue(true);

    const result = await deleteItem("item-1");

    expect(deleteItemRecordMock).toHaveBeenCalledWith("item-1", "user-1");
    expect(result).toEqual({
      success: true,
    });
  });

  it("returns a generic error when delete fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue({
      id: "item-1",
    });
    deleteItemRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "Unable to delete item.",
    });
  });
});
