import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all customers
export async function GET(request: NextRequest) {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: { customerType: true },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST create customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, markupPercent = 5.0, customerTypeId } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        markupPercent,
        ...(customerTypeId && { customerTypeId: parseInt(customerTypeId) }),
      },
      include: { customerType: true },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    const err = error as any;
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}

// DELETE bulk delete customers
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

    const result = await prisma.customer.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({ deleted: result.count }, { status: 200 });
  } catch (error) {
    console.error("Error deleting customers:", error);
    return NextResponse.json(
      { error: "Failed to delete customers" },
      { status: 500 }
    );
  }
}
