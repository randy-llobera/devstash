import { NextResponse } from "next/server";

import { issueEmailVerification } from "@/lib/email-verification";
import { isEmailVerificationEnabled } from "@/lib/email-verification-settings";
import { prisma } from "@/lib/prisma";
import {
  checkAuthRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";

interface ResendVerificationRequestBody {
  email?: string;
}

const BAD_REQUEST_STATUS = 400;

const isValidEmail = (email: string) => email.includes("@");

export const POST = async (request: Request) => {
  if (!isEmailVerificationEnabled()) {
    return NextResponse.json({ success: true });
  }

  let body: ResendVerificationRequestBody;

  try {
    body = (await request.json()) as ResendVerificationRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const rateLimitResult = await checkAuthRateLimit({
    identifier: email,
    keyBy: "ip-email",
    request,
    type: "verificationResend",
  });

  if (!rateLimitResult.success) {
    return createRateLimitErrorResponse(rateLimitResult);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      emailVerified: true,
      name: true,
      password: true,
    },
  });

  if (user?.password && !user.emailVerified) {
    try {
      await issueEmailVerification({
        email: user.email,
        name: user.name,
        baseUrl: new URL(request.url).origin,
      });
    } catch (error) {
      console.error("Verification resend failed", error);
    }
  }

  return NextResponse.json({ success: true });
};
