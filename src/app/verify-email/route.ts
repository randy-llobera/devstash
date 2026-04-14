import { NextResponse } from "next/server";

import { hashVerificationToken } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";

const getRedirectUrl = (request: Request, search: string) => {
  const url = new URL("/sign-in", request.url);
  url.search = search;
  return url;
};

export const GET = async (request: Request) => {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(getRedirectUrl(request, "?verification=invalid"));
  }

  const hashedToken = hashVerificationToken(token);
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token: hashedToken },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    if (verificationToken) {
      await prisma.verificationToken.delete({
        where: { token: verificationToken.token },
      });
    }

    return NextResponse.redirect(getRedirectUrl(request, "?verification=invalid"));
  }

  const result = await prisma.user.updateMany({
    where: { email: verificationToken.identifier },
    data: {
      emailVerified: new Date(),
    },
  });

  if (result.count === 0) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: verificationToken.identifier },
    });

    return NextResponse.redirect(getRedirectUrl(request, "?verification=invalid"));
  }

  await prisma.verificationToken.deleteMany({
    where: { identifier: verificationToken.identifier },
  });

  return NextResponse.redirect(getRedirectUrl(request, "?verified=1"));
};
