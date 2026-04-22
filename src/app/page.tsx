import type { Metadata } from "next";

import { auth } from "@/auth";
import { HomepagePage } from "@/components/homepage/homepage-page";

export const metadata: Metadata = {
  title: "DevStash | Stop Losing Your Developer Knowledge",
  description:
    "DevStash keeps your snippets, prompts, commands, notes, files, images, and links in one fast, searchable hub.",
};

export default async function HomePage() {
  const session = await auth();

  return <HomepagePage isSignedIn={Boolean(session?.user?.id)} />;
}
