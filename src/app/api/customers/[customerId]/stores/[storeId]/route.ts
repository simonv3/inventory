import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT update customer store relationship (e.g., storeManager flag)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string; storeId: string }> }
) {
  try {
    const { customerId, storeId } = await params;
    const body = await request.json();
    const { storeManager, markupPercent } = body;

    const customerStore = await prisma.customerStore.update({
      where: {
        customerId_storeId: {
          customerId: parseInt(customerId),
          storeId: parseInt(storeId),
        },
      },
      data: {
        ...(storeManager !== undefined && { storeManager }),
        ...(markupPercent !== undefined && { markupPercent }),
      },
      include: {
        store: true,
        customerType: true,
      },
    });

    return NextResponse.json(customerStore);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Customer store association not found" },
        { status: 404 }
      );
    }
    console.error("Error updating customer store:", error);
    return NextResponse.json(
      { error: "Failed to update customer store" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string; storeId: string }> }
) {
  try {
    const { customerId, storeId } = await params;
    await prisma.customerStore.delete({
      where: {
        customerId_storeId: {
          customerId: parseInt(customerId),
          storeId: parseInt(storeId),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Customer store association not found" },
        { status: 404 }
      );
    }
    console.error("Error removing store from customer:", error);
    return NextResponse.json(
      { error: "Failed to remove store from customer" },
      { status: 500 }
    );
  }
}
