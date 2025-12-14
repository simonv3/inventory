import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// DELETE remove a store from a customer
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
