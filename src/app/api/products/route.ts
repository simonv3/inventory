import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getStoreIdFromRequest } from "@/lib/storeUtils";

// GET all products with categories and sources
export async function GET(request: NextRequest) {
  try {
    const storeId = getStoreIdFromRequest(request);

    const products = await prisma.product.findMany({
      where: storeId ? { storeId } : {},
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        source: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Format response to flatten categories
    const formattedProducts = products.map((product) => ({
      ...product,
      categories: product.categories.map((pc) => pc.category),
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.log("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      sku,
      categoryIds,
      isOrganic,
      showInStorefront,
      unitOfMeasurement,
      pricePerUnit,
      minimumStock,
      sourceId,
    } = body;

    if (
      !name ||
      !sku ||
      !unitOfMeasurement ||
      pricePerUnit === undefined ||
      minimumStock === undefined ||
      !sourceId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const store = await prisma.store.findFirst();
    if (!store) {
      return NextResponse.json(
        { error: "No store found to associate the product with" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        storeId: store.id,
        isOrganic: isOrganic || false,
        showInStorefront: showInStorefront !== false,
        unitOfMeasurement,
        pricePerUnit: parseFloat(pricePerUnit),
        minimumStock: parseInt(minimumStock),
        ...(sourceId && { sourceId: parseInt(sourceId) }),
        categories: {
          create: (categoryIds || []).map((categoryId: number) => ({
            category: {
              connect: { id: categoryId },
            },
          })),
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        source: true,
        store: true,
      },
    });

    // Format response to flatten categories
    return NextResponse.json(
      {
        ...product,
        categories: product.categories.map((pc) => pc.category),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    const errorCode = (error as any)?.code;

    if (errorCode === "P2003") {
      return NextResponse.json(
        { error: "Selected source does not exist" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

// DELETE bulk delete products
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids must be a non-empty array" },
        { status: 400 }
      );
    }

    const result = await prisma.product.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({ deleted: result.count }, { status: 200 });
  } catch (error) {
    console.error("Error deleting products:", error);
    return NextResponse.json(
      { error: "Failed to delete products" },
      { status: 500 }
    );
  }
}
