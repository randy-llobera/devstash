import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  createCollectionRecordMock,
  deleteCollectionRecordMock,
  updateCollectionRecordMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  createCollectionRecordMock: vi.fn(),
  deleteCollectionRecordMock: vi.fn(),
  updateCollectionRecordMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/collections", () => ({
  createCollection: createCollectionRecordMock,
  deleteCollection: deleteCollectionRecordMock,
  updateCollection: updateCollectionRecordMock,
}));

import { createCollection, deleteCollection, updateCollection } from "@/actions/collections";

describe("collections actions", () => {
  beforeEach(() => {
    authMock.mockReset();
    createCollectionRecordMock.mockReset();
    deleteCollectionRecordMock.mockReset();
    updateCollectionRecordMock.mockReset();
  });

  it("rejects unauthenticated create requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await createCollection({
      name: "Frontend patterns",
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to create collections.",
    });
    expect(createCollectionRecordMock).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid payloads", async () => {
    const result = await createCollection({
      name: "   ",
    });

    expect(result).toEqual({
      success: false,
      error: {
        message: "Please fix the highlighted fields.",
        fieldErrors: {
          name: ["Name is required."],
        },
      },
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(createCollectionRecordMock).not.toHaveBeenCalled();
  });

  it("normalizes optional values before creating", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    createCollectionRecordMock.mockResolvedValue({
      id: "collection-1",
      name: "Frontend patterns",
      description: null,
    });

    const result = await createCollection({
      name: "  Frontend patterns  ",
      description: "   ",
    });

    expect(createCollectionRecordMock).toHaveBeenCalledWith("user-1", {
      name: "Frontend patterns",
      description: null,
    });
    expect(result).toEqual({
      success: true,
      data: {
        id: "collection-1",
        name: "Frontend patterns",
        description: null,
      },
    });
  });

  it("returns a generic error when create fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    createCollectionRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await createCollection({
      name: "Frontend patterns",
      description: "Components and layout notes",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to create collection.",
    });
  });

  it("rejects unauthenticated update requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await updateCollection("collection-1", {
      name: "Frontend patterns",
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to update collections.",
    });
    expect(updateCollectionRecordMock).not.toHaveBeenCalled();
  });

  it("validates update payloads before loading auth", async () => {
    const result = await updateCollection("collection-1", {
      name: "   ",
    });

    expect(result).toEqual({
      success: false,
      error: {
        message: "Please fix the highlighted fields.",
        fieldErrors: {
          name: ["Name is required."],
        },
      },
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(updateCollectionRecordMock).not.toHaveBeenCalled();
  });

  it("normalizes optional values before updating", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateCollectionRecordMock.mockResolvedValue({
      id: "collection-1",
      name: "Frontend patterns",
      description: null,
    });

    const result = await updateCollection("collection-1", {
      name: "  Frontend patterns  ",
      description: "   ",
    });

    expect(updateCollectionRecordMock).toHaveBeenCalledWith("user-1", "collection-1", {
      name: "Frontend patterns",
      description: null,
    });
    expect(result).toEqual({
      success: true,
      data: {
        id: "collection-1",
        name: "Frontend patterns",
        description: null,
      },
    });
  });

  it("returns a not found error when update misses the collection", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateCollectionRecordMock.mockResolvedValue(null);

    const result = await updateCollection("collection-1", {
      name: "Frontend patterns",
    });

    expect(result).toEqual({
      success: false,
      error: "Collection not found.",
    });
  });

  it("returns a generic error when update fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateCollectionRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await updateCollection("collection-1", {
      name: "Frontend patterns",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to update collection.",
    });
  });

  it("rejects unauthenticated delete requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await deleteCollection("collection-1");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to delete collections.",
    });
    expect(deleteCollectionRecordMock).not.toHaveBeenCalled();
  });

  it("deletes an owned collection", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    deleteCollectionRecordMock.mockResolvedValue(true);

    const result = await deleteCollection("collection-1");

    expect(deleteCollectionRecordMock).toHaveBeenCalledWith("user-1", "collection-1");
    expect(result).toEqual({
      success: true,
    });
  });

  it("returns a not found error when delete misses the collection", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    deleteCollectionRecordMock.mockResolvedValue(false);

    const result = await deleteCollection("collection-1");

    expect(result).toEqual({
      success: false,
      error: "Collection not found.",
    });
  });

  it("returns a generic error when delete fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    deleteCollectionRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await deleteCollection("collection-1");

    expect(result).toEqual({
      success: false,
      error: "Unable to delete collection.",
    });
  });
});
