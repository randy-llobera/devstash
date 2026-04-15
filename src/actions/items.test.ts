import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, getItemDrawerDetailMock, updateItemRecordMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getItemDrawerDetailMock: vi.fn(),
  updateItemRecordMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  getItemDrawerDetail: getItemDrawerDetailMock,
  updateItem: updateItemRecordMock,
}));

import { updateItem } from "@/actions/items";

describe("updateItem action", () => {
  beforeEach(() => {
    authMock.mockReset();
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
