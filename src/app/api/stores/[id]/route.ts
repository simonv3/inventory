import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storeId = parseInt(id);
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { products: true },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Failed to fetch store" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storeId = parseInt(id);
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Store name is required" },
        { status: 400 }
      );
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data: { name },
      include: { products: true },
    });

    return NextResponse.json(store);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Store name already exists" },
        { status: 400 }
      );
    }
    console.error("Error updating store:", error);
    return NextResponse.json(
      { error: "Failed to update store" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storeId = parseInt(id);

    // Check if store has products
    const productsCount = await prisma.product.count({
      where: { storeId },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete store with products. Please delete products first.",
        },
        { status: 400 }
      );
    }

    const store = await prisma.store.delete({
      where: { id: storeId },
    });

    return NextResponse.json(store);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    console.error("Error deleting store:", error);
    return NextResponse.json(
      { error: "Failed to delete store" },
      { status: 500 }
    );
  }
}
