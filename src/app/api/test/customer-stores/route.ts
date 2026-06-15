import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Only allow in development and test environments
function isTestEnvironment() {
  return (
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
  );
}

// POST /api/test/customer-stores — link a customer to a store with a markup
// percent (test setup only). This is what makes a customer appear in a store's
// storefront cart and supplies the markup applied to their orders.
export async function POST(request: NextRequest) {
  if (!isTestEnvironment()) {
    return NextResponse.json(
      { error: "Test endpoints only available in development" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { customerId, storeId, markupPercent, storeManager } = body;

    if (!customerId || !storeId) {
      return NextResponse.json(
        { error: "customerId and storeId are required" },
        { status: 400 }
      );
    }

    const customerStore = await prisma.customerStore.create({
      data: {
        customerId,
        storeId,
        markupPercent: markupPercent ?? 5.0,
        storeManager: storeManager ?? false,
      },
    });

    return NextResponse.json(customerStore, { status: 201 });
  } catch (error) {
    console.error("Error creating test customer-store link:", error);
    return NextResponse.json(
      { error: "Failed to create customer-store link" },
      { status: 500 }
    );
  }
}
