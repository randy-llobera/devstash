import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type ConnectionRow = {
  current_database: string;
  current_schema: string;
  now: Date;
};

const main = async () => {
  const connectionInfo = await prisma.$queryRaw<ConnectionRow[]>`
    SELECT
      current_database(),
      current_schema(),
      now()
  `;

  const itemTypeCount = await prisma.itemType.count();
  const userCount = await prisma.user.count();

  console.log("Database connection successful");
  console.log({
    database: connectionInfo[0]?.current_database ?? null,
    schema: connectionInfo[0]?.current_schema ?? null,
    timestamp: connectionInfo[0]?.now?.toISOString?.() ?? null,
    itemTypeCount,
    userCount,
  });
};

main()
  .catch((error: unknown) => {
    console.error("Database test failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
