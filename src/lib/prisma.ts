import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let client: PrismaClient;

if (!globalForPrisma.prisma) {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const adapter = new PrismaBetterSqlite3({ url });
  client = new PrismaClient({ adapter });
} else {
  client = globalForPrisma.prisma;
}

export const prisma = client;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = client;
}
