import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Only allow in development and test environments
function isTestEnvironment() {
  return (
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
  );
}

export async function POST(request: NextRequest) {
  // Check if test environment
  if (!isTestEnvironment()) {
    return NextResponse.json(
      { error: "Test endpoints only available in development" },
      { status: 403 },
    );
  }

  try {
    // Delete all data in the correct order (respecting foreign keys)
    await prisma.sale.deleteMany({});
    await prisma.saleItem.deleteMany({});
    await prisma.inventoryReceived.deleteMany({});
    await prisma.productCategory.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.customerStore.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.source.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.customerType.deleteMany({});

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error resetting database:", error);
    return NextResponse.json(
      { error: "Failed to reset database" },
      { status: 500 },
    );
  }
}
