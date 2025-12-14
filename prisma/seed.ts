import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

console.log("database url:", process.env.DATABASE_URL);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  if (!(await prisma.store.findFirst())) {
    // Create default store
    await prisma.store.create({
      data: {
        name: "Main Store",
      },
    });
    console.log("Created default store");
  }
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
