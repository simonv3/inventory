import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET single sale
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}

// PUT update sale
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // For simplicity, only allow updating markup percent and sale date
    const sale = await prisma.sale.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.markupPercent !== undefined && {
          markupPercent: parseFloat(body.markupPercent),
        }),
        ...(body.saleDate && { saleDate: new Date(body.saleDate) }),
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update sale" },
      { status: 500 }
    );
  }
}

// DELETE sale
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.sale.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}
