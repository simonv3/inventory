import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let client: PrismaClient;

if (!globalForPrisma.prisma) {
  const provider = process.env.DATABASE_PROVIDER || "sqlite";
  const url = process.env.DATABASE_URL || "file:./dev.db";

  if (provider === "sqlite") {
    const adapter = new PrismaBetterSqlite3({ url });
    client = new PrismaClient({ adapter });
  } else {
    // PostgreSQL or other providers don't need an adapter
    client = new PrismaClient();
  }
} else {
  client = globalForPrisma.prisma;
}

export const prisma = client;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = client;
}
