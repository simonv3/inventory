import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all stores for a customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const customerStores = await prisma.customerStore.findMany({
      where: { customerId: parseInt(customerId) },
      include: {
        store: { include: { products: true } },
      },
    });

    return NextResponse.json(customerStores);
  } catch (error) {
    console.error("Error fetching customer stores:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer stores" },
      { status: 500 }
    );
  }
}

// POST add a store to a customer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }

    const customerStore = await prisma.customerStore.create({
      data: {
        customerId: parseInt(customerId),
        storeId: parseInt(storeId),
      },
      include: {
        store: { include: { products: true } },
      },
    });

    return NextResponse.json(customerStore, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Customer is already associated with this store" },
        { status: 400 }
      );
    }
    console.error("Error adding store to customer:", error);
    return NextResponse.json(
      { error: "Failed to add store to customer" },
      { status: 500 }
    );
  }
}
