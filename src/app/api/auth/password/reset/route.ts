import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { getPasswordResetEmail, hashVerificationToken } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import {
  checkAuthRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";

interface ResetPasswordRequestBody {
  confirmPassword?: string;
  password?: string;
  token?: string;
}

const BAD_REQUEST_STATUS = 400;
const MIN_PASSWORD_LENGTH = 8;

export const POST = async (request: Request) => {
  let body: ResetPasswordRequestBody;

  try {
    body = (await request.json()) as ResetPasswordRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!token || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "Token, password, and confirmPassword are required." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: BAD_REQUEST_STATUS },
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const rateLimitResult = await checkAuthRateLimit({
    keyBy: "ip",
    request,
    type: "passwordReset",
  });

  if (!rateLimitResult.success) {
    return createRateLimitErrorResponse(rateLimitResult);
  }

  const hashedToken = hashVerificationToken(token);
  const resetToken = await prisma.verificationToken.findUnique({
    where: { token: hashedToken },
  });

  if (!resetToken) {
    return NextResponse.json(
      { error: "That reset link is invalid or has expired." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  if (resetToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token: resetToken.token },
    });

    return NextResponse.json(
      { error: "That reset link is invalid or has expired." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const email = getPasswordResetEmail(resetToken.identifier);

  if (!email) {
    await prisma.verificationToken.delete({
      where: { token: resetToken.token },
    });

    return NextResponse.json(
      { error: "That reset link is invalid or has expired." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user?.password) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: resetToken.identifier },
    });

    return NextResponse.json(
      { error: "That reset link is invalid or has expired." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await prisma.verificationToken.deleteMany({
    where: { identifier: resetToken.identifier },
  });

  return NextResponse.json({ success: true, email });
};
