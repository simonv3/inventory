import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET single inventory entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inventory = await prisma.inventoryReceived.findUnique({
      where: { id: parseInt(id) },
      include: { product: true },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(inventory);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch inventory entry" },
      { status: 500 }
    );
  }
}

// PUT update inventory entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const inventory = await prisma.inventoryReceived.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.quantity !== undefined && {
          quantity: parseInt(body.quantity),
        }),
        ...(body.receivedDate && { receivedDate: new Date(body.receivedDate) }),
        ...(body.receiptUrl !== undefined && { receiptUrl: body.receiptUrl }),
      },
      include: { product: true },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json(
        { error: "Inventory entry not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update inventory entry" },
      { status: 500 }
    );
  }
}

// DELETE inventory entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.inventoryReceived.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json(
        { error: "Inventory entry not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete inventory entry" },
      { status: 500 }
    );
  }
}
