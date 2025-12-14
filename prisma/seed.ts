import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const provider = process.env.DATABASE_PROVIDER || "sqlite";
const url = process.env.DATABASE_URL || "file:./dev.db";

let prisma: PrismaClient;

if (provider === "sqlite") {
  const adapter = new PrismaBetterSqlite3({ url });
  prisma = new PrismaClient({ adapter });
} else {
  // PostgreSQL or other providers don't need an adapter
  prisma = new PrismaClient();
}

async function main() {
  // Create default customer types if they don't exist
  const customerTypes = ["member", "customer"];

  for (const typeName of customerTypes) {
    const existing = await prisma.customerType.findUnique({
      where: { name: typeName },
    });

    if (!existing) {
      await prisma.customerType.create({
        data: { name: typeName },
      });
      console.log(`Created customer type: ${typeName}`);
    } else {
      console.log(`Customer type already exists: ${typeName}`);
    }
  }

  // Create default sources if they don't exist
  const sources = ["Frankferd Farms", "Frontier Co-op", "Costco"];

  for (const sourceName of sources) {
    const existing = await prisma.source.findUnique({
      where: { name: sourceName },
    });

    if (!existing) {
      await prisma.source.create({
        data: { name: sourceName },
      });
      console.log(`Created source: ${sourceName}`);
    } else {
      console.log(`Source already exists: ${sourceName}`);
    }
  }

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
