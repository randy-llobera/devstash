import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  buildUploadedFileUrl,
  getObjectKeyFromFileUrl,
  isFileUploadItemType,
  sanitizeUploadedFileName,
  validateUploadFile,
} from "@/lib/file-upload";
import { deleteR2Object, uploadR2Object } from "@/lib/r2";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to upload files." },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const itemTypeValue = formData.get("itemType");
  const fileValue = formData.get("file");

  if (typeof itemTypeValue !== "string" || !isFileUploadItemType(itemTypeValue)) {
    return NextResponse.json({ error: "Invalid upload type." }, { status: 400 });
  }

  if (!(fileValue instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  const validationError = validateUploadFile(fileValue, itemTypeValue);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const safeFileName = sanitizeUploadedFileName(fileValue.name) || "upload";
  const objectKey = `users/${session.user.id}/${itemTypeValue}/${crypto.randomUUID()}-${safeFileName}`;

  try {
    const fileBuffer = Buffer.from(await fileValue.arrayBuffer());

    await uploadR2Object({
      key: objectKey,
      body: fileBuffer,
      contentType: fileValue.type || "application/octet-stream",
    });

    return NextResponse.json({
      fileName: fileValue.name,
      fileSize: fileValue.size,
      fileUrl: buildUploadedFileUrl(objectKey),
    });
  } catch (error) {
    console.error("Failed to upload file to R2.", error);

    return NextResponse.json({ error: "Unable to upload file." }, { status: 500 });
  }
};

export const DELETE = async (request: Request) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to delete uploaded files." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as { fileUrl?: string } | null;
  const fileUrl = body?.fileUrl;

  if (!fileUrl) {
    return NextResponse.json({ error: "File URL is required." }, { status: 400 });
  }

  const objectKey = getObjectKeyFromFileUrl(fileUrl);

  if (!objectKey || !objectKey.startsWith(`users/${session.user.id}/`)) {
    return NextResponse.json({ error: "Invalid file URL." }, { status: 400 });
  }

  try {
    await deleteR2Object(objectKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete uploaded file from R2.", error);

    return NextResponse.json({ error: "Unable to delete uploaded file." }, { status: 500 });
  }
};
