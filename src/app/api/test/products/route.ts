import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Only allow in development and test environments
function isTestEnvironment() {
  return (
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
  );
}

// POST /api/test/products — create a product for a store (test setup only).
export async function POST(request: NextRequest) {
  if (!isTestEnvironment()) {
    return NextResponse.json(
      { error: "Test endpoints only available in development" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      storeId,
      name,
      sku,
      pricePerUnit,
      unitOfMeasurement,
      minimumStock,
      showInStorefront,
      isOrganic,
    } = body;

    if (!storeId || !name) {
      return NextResponse.json(
        { error: "storeId and name are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        storeId,
        name,
        sku: sku || `${name.toUpperCase().replace(/[^A-Z0-9]/g, "-")}-TEST`,
        pricePerUnit: pricePerUnit ?? 1.0,
        unitOfMeasurement: unitOfMeasurement || "lb",
        minimumStock: minimumStock ?? 0,
        showInStorefront: showInStorefront ?? true,
        isOrganic: isOrganic ?? false,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating test product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
