import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  buildUploadedFileUrlMock,
  deleteR2ObjectMock,
  getObjectKeyFromFileUrlMock,
  isFileUploadItemTypeMock,
  sanitizeUploadedFileNameMock,
  uploadR2ObjectMock,
  validateUploadFileMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  buildUploadedFileUrlMock: vi.fn(),
  deleteR2ObjectMock: vi.fn(),
  getObjectKeyFromFileUrlMock: vi.fn(),
  isFileUploadItemTypeMock: vi.fn(),
  sanitizeUploadedFileNameMock: vi.fn(),
  uploadR2ObjectMock: vi.fn(),
  validateUploadFileMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/file-upload", () => ({
  buildUploadedFileUrl: buildUploadedFileUrlMock,
  getObjectKeyFromFileUrl: getObjectKeyFromFileUrlMock,
  isFileUploadItemType: isFileUploadItemTypeMock,
  sanitizeUploadedFileName: sanitizeUploadedFileNameMock,
  validateUploadFile: validateUploadFileMock,
}));

vi.mock("@/lib/r2", () => ({
  deleteR2Object: deleteR2ObjectMock,
  uploadR2Object: uploadR2ObjectMock,
}));

import { DELETE, POST } from "@/app/api/uploads/route";

describe("uploads route POST", () => {
  beforeEach(() => {
    authMock.mockReset();
    buildUploadedFileUrlMock.mockReset();
    deleteR2ObjectMock.mockReset();
    getObjectKeyFromFileUrlMock.mockReset();
    isFileUploadItemTypeMock.mockReset();
    sanitizeUploadedFileNameMock.mockReset();
    uploadR2ObjectMock.mockReset();
    validateUploadFileMock.mockReset();
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("uuid-1");
  });

  it("rejects unauthenticated uploads", async () => {
    authMock.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost/api/uploads", { method: "POST" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "You must be signed in to upload files.",
    });
  });

  it("rejects invalid upload types", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    isFileUploadItemTypeMock.mockReturnValue(false);

    const formData = new FormData();
    formData.append("itemType", "snippet");
    formData.append("file", new File(["test"], "test.txt", { type: "text/plain" }));

    const response = await POST(
      new Request("http://localhost/api/uploads", { method: "POST", body: formData })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid upload type." });
  });

  it("uploads a validated file to R2", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    isFileUploadItemTypeMock.mockReturnValue(true);
    validateUploadFileMock.mockReturnValue(null);
    sanitizeUploadedFileNameMock.mockReturnValue("spec.pdf");
    buildUploadedFileUrlMock.mockReturnValue("https://files.example.com/spec.pdf");

    const formData = new FormData();
    formData.append("itemType", "file");
    formData.append(
      "file",
      new File(["hello"], "Spec.pdf", { type: "application/pdf" })
    );

    const response = await POST(
      new Request("http://localhost/api/uploads", { method: "POST", body: formData })
    );

    expect(uploadR2ObjectMock).toHaveBeenCalledWith({
      key: "users/user-1/file/uuid-1-spec.pdf",
      body: expect.any(Buffer),
      contentType: "application/pdf",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      fileName: "Spec.pdf",
      fileSize: 5,
      fileUrl: "https://files.example.com/spec.pdf",
    });
  });
});

describe("uploads route DELETE", () => {
  beforeEach(() => {
    authMock.mockReset();
    deleteR2ObjectMock.mockReset();
    getObjectKeyFromFileUrlMock.mockReset();
  });

  it("rejects invalid file URLs", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getObjectKeyFromFileUrlMock.mockReturnValue(null);

    const response = await DELETE(
      new Request("http://localhost/api/uploads", {
        method: "DELETE",
        body: JSON.stringify({ fileUrl: "https://example.com/file.pdf" }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid file URL." });
  });

  it("deletes the uploaded object for the current user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getObjectKeyFromFileUrlMock.mockReturnValue("users/user-1/file/file.pdf");

    const response = await DELETE(
      new Request("http://localhost/api/uploads", {
        method: "DELETE",
        body: JSON.stringify({ fileUrl: "https://files.example.com/file.pdf" }),
      })
    );

    expect(deleteR2ObjectMock).toHaveBeenCalledWith("users/user-1/file/file.pdf");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});
