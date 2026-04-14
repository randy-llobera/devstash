import { createHash, randomBytes } from "node:crypto";

import { Resend } from "resend";

import { prisma } from "@/lib/prisma";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const getEmailVerificationSubject = () => "Verify your DevStash email";

const getEmailVerificationHtml = ({
  name,
  verificationUrl,
}: {
  name: string | null;
  verificationUrl: string;
}) => {
  const greeting = name ? `Hi ${name},` : "Hi,";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
      <p>${greeting}</p>
      <p>Click the link below to verify your email address for DevStash.</p>
      <p><a href="${verificationUrl}">Verify your email</a></p>
      <p>If you did not create this account, you can ignore this message.</p>
    </div>
  `;
};

export const hashVerificationToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const createVerificationUrl = ({
  baseUrl,
  token,
}: {
  baseUrl: string;
  token: string;
}) => {
  const url = new URL("/verify-email", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
};

export const issueEmailVerification = async ({
  email,
  name,
  baseUrl,
}: {
  email: string;
  name: string | null;
  baseUrl: string;
}) => {
  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = hashVerificationToken(rawToken);
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedToken,
      expires,
    },
  });

  const verificationUrl = createVerificationUrl({
    baseUrl,
    token: rawToken,
  });

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required to send verification emails.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send(
    {
      from: "onboarding@resend.dev",
      to: [email],
      subject: getEmailVerificationSubject(),
      html: getEmailVerificationHtml({ name, verificationUrl }),
    },
    {
      idempotencyKey: `verify-email/${hashedToken}`,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
};
