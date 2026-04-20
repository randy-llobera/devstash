import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, createCollectionRecordMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  createCollectionRecordMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/collections", () => ({
  createCollection: createCollectionRecordMock,
}));

import { createCollection } from "@/actions/collections";

describe("createCollection action", () => {
  beforeEach(() => {
    authMock.mockReset();
    createCollectionRecordMock.mockReset();
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
});
