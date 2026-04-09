import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { ContentType, PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the Prisma seed");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEMO_USER_EMAIL = "demo@devstash.io";
const DEMO_USER_PASSWORD = "12345678";

const systemItemTypes = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" },
] as const;

type SeedItem = {
  title: string;
  contentType: ContentType;
  itemTypeName: (typeof systemItemTypes)[number]["name"];
  content?: string;
  url?: string;
  description?: string;
  language?: string;
};

type SeedCollection = {
  name: string;
  description: string;
  defaultTypeName: (typeof systemItemTypes)[number]["name"];
  items: SeedItem[];
};

const seedCollections: SeedCollection[] = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    defaultTypeName: "snippet",
    items: [
      {
        title: "useDebounce Hook",
        contentType: ContentType.TEXT,
        itemTypeName: "snippet",
        language: "typescript",
        description: "Delay fast-changing values before triggering expensive work.",
        content: `import { useEffect, useState } from "react";

export const useDebounce = <T>(value: T, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
};`,
      },
      {
        title: "Compound Components Pattern",
        contentType: ContentType.TEXT,
        itemTypeName: "snippet",
        language: "typescript",
        description: "Share state between related components with context.",
        content: `import { createContext, useContext, useState, type ReactNode } from "react";

type TabsContextValue = {
  activeTab: string;
  setActiveTab: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabs = () => {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be used inside <Tabs />");
  }

  return context;
};

export const Tabs = ({ children, initialTab }: { children: ReactNode; initialTab: string }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};`,
      },
      {
        title: "groupBy Utility",
        contentType: ContentType.TEXT,
        itemTypeName: "snippet",
        language: "typescript",
        description: "Group arrays by a derived key without losing type safety.",
        content: `export const groupBy = <T, K extends PropertyKey>(
  items: T[],
  getKey: (item: T) => K,
) => {
  return items.reduce<Record<K, T[]>>((groups, item) => {
    const key = getKey(item);
    const currentGroup = groups[key] ?? [];

    currentGroup.push(item);
    groups[key] = currentGroup;

    return groups;
  }, {} as Record<K, T[]>);
};`,
      },
    ],
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    defaultTypeName: "prompt",
    items: [
      {
        title: "Code Review Prompt",
        contentType: ContentType.TEXT,
        itemTypeName: "prompt",
        description: "Review a diff for regressions, edge cases, and missing tests.",
        content: `Review this code change as a senior engineer.

Focus on:
- correctness and regressions
- edge cases
- missing tests
- risky assumptions

Return findings ordered by severity with file references and a short test plan.`,
      },
      {
        title: "Documentation Generation Prompt",
        contentType: ContentType.TEXT,
        itemTypeName: "prompt",
        description: "Turn source code into concise docs for internal teams.",
        content: `Generate internal documentation for this module.

Include:
- purpose
- key inputs and outputs
- important side effects
- example usage
- known limitations

Keep the tone technical and concise.`,
      },
      {
        title: "Refactoring Assistance Prompt",
        contentType: ContentType.TEXT,
        itemTypeName: "prompt",
        description: "Ask an AI assistant to reduce complexity without changing behavior.",
        content: `Refactor this code with behavior preserved.

Constraints:
- no public API changes
- prefer incremental improvements
- remove duplication
- keep naming explicit

Show the proposed patch and list the main tradeoffs.`,
      },
    ],
  },
  {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    defaultTypeName: "command",
    items: [
      {
        title: "Multi-stage Node Dockerfile",
        contentType: ContentType.TEXT,
        itemTypeName: "snippet",
        language: "dockerfile",
        description: "Build and run a production Node app with a slim final image.",
        content: `FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
CMD ["npm", "start"]`,
      },
      {
        title: "Deploy Application Command",
        contentType: ContentType.TEXT,
        itemTypeName: "command",
        description: "Build, migrate, and restart a production deployment over SSH.",
        content: `ssh deploy@server.example.com '
  cd /srv/devstash &&
  git pull --ff-only &&
  npm ci &&
  npm run build &&
  npx prisma migrate deploy &&
  sudo systemctl restart devstash
'`,
      },
      {
        title: "Docker Buildx Docs",
        contentType: ContentType.URL,
        itemTypeName: "link",
        url: "https://docs.docker.com/build/buildx/",
        description: "Reference for advanced Docker builds and multi-platform images.",
      },
      {
        title: "GitHub Actions Docs",
        contentType: ContentType.URL,
        itemTypeName: "link",
        url: "https://docs.github.com/en/actions",
        description: "Workflow syntax, runners, and CI/CD automation reference.",
      },
    ],
  },
  {
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    defaultTypeName: "command",
    items: [
      {
        title: "Git Cleanup",
        contentType: ContentType.TEXT,
        itemTypeName: "command",
        description: "Fetch, prune, and review local branch state.",
        content: "git fetch --all --prune && git branch -vv",
      },
      {
        title: "Docker Container Inspection",
        contentType: ContentType.TEXT,
        itemTypeName: "command",
        description: "List running containers with names, ports, and status.",
        content: "docker ps --format 'table {{.Names}}\\t{{.Image}}\\t{{.Ports}}\\t{{.Status}}'",
      },
      {
        title: "Process Lookup",
        contentType: ContentType.TEXT,
        itemTypeName: "command",
        description: "Find processes bound to a local port.",
        content: "lsof -iTCP:3000 -sTCP:LISTEN -n -P",
      },
      {
        title: "Package Update Check",
        contentType: ContentType.TEXT,
        itemTypeName: "command",
        description: "Show outdated npm packages before upgrading.",
        content: "npm outdated",
      },
    ],
  },
  {
    name: "Design Resources",
    description: "UI/UX resources and references",
    defaultTypeName: "link",
    items: [
      {
        title: "Tailwind CSS Docs",
        contentType: ContentType.URL,
        itemTypeName: "link",
        url: "https://tailwindcss.com/docs",
        description: "Core utility reference and framework guides.",
      },
      {
        title: "shadcn/ui",
        contentType: ContentType.URL,
        itemTypeName: "link",
        url: "https://ui.shadcn.com/",
        description: "Composable UI components for React and Tailwind CSS.",
      },
      {
        title: "Material Design 3",
        contentType: ContentType.URL,
        itemTypeName: "link",
        url: "https://m3.material.io/",
        description: "Design system guidance for layout, motion, and accessibility.",
      },
      {
        title: "Lucide Icons",
        contentType: ContentType.URL,
        itemTypeName: "link",
        url: "https://lucide.dev/icons/",
        description: "Open-source icon library used by the seeded item types.",
      },
    ],
  },
];

const getItemTypeId = (
  itemTypeIds: Map<string, string>,
  itemTypeName: (typeof systemItemTypes)[number]["name"],
) => {
  const itemTypeId = itemTypeIds.get(itemTypeName);

  if (!itemTypeId) {
    throw new Error(`Missing system item type: ${itemTypeName}`);
  }

  return itemTypeId;
};

const ensureSystemItemTypes = async () => {
  const records = [];

  for (const itemType of systemItemTypes) {
    const existingItemType = await prisma.itemType.findFirst({
      where: {
        name: itemType.name,
        userId: null,
      },
    });

    if (existingItemType) {
      const updatedItemType = await prisma.itemType.update({
        where: {
          id: existingItemType.id,
        },
        data: {
          icon: itemType.icon,
          color: itemType.color,
          isSystem: true,
        },
      });

      records.push(updatedItemType);
      continue;
    }

    const createdItemType = await prisma.itemType.create({
      data: {
        ...itemType,
        isSystem: true,
      },
    });

    records.push(createdItemType);
  }

  return new Map(records.map((record) => [record.name, record.id]));
};

const main = async () => {
  const itemTypeIds = await ensureSystemItemTypes();
  const passwordHash = await bcrypt.hash(DEMO_USER_PASSWORD, 12);

  await prisma.itemCollection.deleteMany({
    where: {
      collection: {
        user: {
          email: DEMO_USER_EMAIL,
        },
      },
    },
  });

  await prisma.item.deleteMany({
    where: {
      user: {
        email: DEMO_USER_EMAIL,
      },
    },
  });

  await prisma.collection.deleteMany({
    where: {
      user: {
        email: DEMO_USER_EMAIL,
      },
    },
  });

  const user = await prisma.user.upsert({
    where: {
      email: DEMO_USER_EMAIL,
    },
    update: {
      name: "Demo User",
      password: passwordHash,
      isPro: false,
      emailVerified: new Date(),
    },
    create: {
      email: DEMO_USER_EMAIL,
      name: "Demo User",
      password: passwordHash,
      isPro: false,
      emailVerified: new Date(),
    },
  });

  for (const seedCollection of seedCollections) {
    const collection = await prisma.collection.create({
      data: {
        name: seedCollection.name,
        description: seedCollection.description,
        userId: user.id,
        defaultTypeId: getItemTypeId(itemTypeIds, seedCollection.defaultTypeName),
      },
    });

    for (const seedItem of seedCollection.items) {
      const item = await prisma.item.create({
        data: {
          title: seedItem.title,
          contentType: seedItem.contentType,
          content: seedItem.content,
          url: seedItem.url,
          description: seedItem.description,
          language: seedItem.language,
          userId: user.id,
          itemTypeId: getItemTypeId(itemTypeIds, seedItem.itemTypeName),
        },
      });

      await prisma.itemCollection.create({
        data: {
          itemId: item.id,
          collectionId: collection.id,
        },
      });
    }
  }
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
