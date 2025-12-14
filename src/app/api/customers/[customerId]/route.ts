import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all stores for a customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const customerStores = await prisma.customer.findFirst({
      where: { id: parseInt(customerId) },
    });

    if (!customerStores) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customerStores);
  } catch (error) {
    console.error("Error fetching customer stores:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer stores" },
      { status: 500 }
    );
  }
}

// PUT update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const body = await request.json();
    const { name, email, markupPercent, customerTypeId } = body;

    const customer = await prisma.customer.update({
      where: { id: parseInt(customerId) },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(markupPercent !== undefined && { markupPercent }),
        ...(customerTypeId !== undefined && {
          customerTypeId: customerTypeId ? parseInt(customerTypeId) : null,
        }),
      },
      include: { customerType: true },
    });

    return NextResponse.json(customer);
  } catch (error) {
    const err = error as unknown as { code?: string };
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }
    if (err?.code === "P2025") {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    await prisma.customer.delete({
      where: { id: parseInt(customerId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as unknown as { code?: string };
    if (err?.code === "P2025") {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
