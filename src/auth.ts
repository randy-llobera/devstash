import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";

import authConfig from "@/auth.config";
import { isEmailVerificationEnabled } from "@/lib/email-verification-settings";
import { prisma } from "@/lib/prisma";

const credentialsProvider = Credentials({
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const email =
      typeof credentials?.email === "string"
        ? credentials.email.trim().toLowerCase()
        : "";
    const password =
      typeof credentials?.password === "string" ? credentials.password : "";

    if (!email || !password) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user?.password) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (
      !isValidPassword ||
      (isEmailVerificationEnabled() && !user.emailVerified)
    ) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
  ...authConfig,
  providers:
    authConfig.providers?.map((provider) => {
      if (typeof provider === "function") {
        return provider;
      }

      return provider.id === credentialsProvider.id ? credentialsProvider : provider;
    }) ?? [],
});

export const { GET, POST } = handlers;
