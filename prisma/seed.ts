import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

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

  // Create default store if it doesn't exist
  const existingStore = await prisma.store.findUnique({
    where: { name: "Main Store" },
  });

  if (!existingStore) {
    await prisma.store.create({
      data: { name: "Main Store" },
    });
    console.log("Created default store: Main Store");
  } else {
    console.log("Default store already exists: Main Store");
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
