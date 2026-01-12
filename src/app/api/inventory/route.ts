import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getStoreIdFromRequest } from "@/lib/storeUtils";

// GET all inventory received
export async function GET(request: NextRequest) {
  try {
    const storeId = getStoreIdFromRequest(request);

    const inventory = await prisma.inventoryReceived.findMany({
      include: { product: true },
      orderBy: { receivedDate: "desc" },
      where: storeId ? { product: { storeId } } : {},
    });
    return NextResponse.json(inventory);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// POST create inventory received entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, receivedDate, receiptUrl } = body;

    if (!productId || !quantity || !receivedDate) {
      return NextResponse.json(
        { error: "Product ID, quantity, and received date are required" },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const inventory = await prisma.inventoryReceived.create({
      data: {
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        receivedDate: new Date(receivedDate),
        receiptUrl: receiptUrl || null,
      },
      include: { product: true },
    });

    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory entry:", error);
    return NextResponse.json(
      { error: "Failed to create inventory entry" },
      { status: 500 }
    );
  }
}

// DELETE bulk delete inventory entries
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

    const result = await prisma.inventoryReceived.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({ deleted: result.count }, { status: 200 });
  } catch (error) {
    console.error("Error deleting inventory entries:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory entries" },
      { status: 500 }
    );
  }
}
