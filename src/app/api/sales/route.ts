import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface SaleItem {
  productId: string | number;
  quantity: string | number;
  costPrice?: string | number;
  salePrice?: string | number;
}

// GET all sales
export async function GET(request: NextRequest) {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { saleDate: "desc" },
    });
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

// POST create sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, items, markupPercent } = body;

    if (
      !customerId ||
      !items ||
      items.length === 0 ||
      markupPercent === undefined
    ) {
      return NextResponse.json(
        { error: "Customer ID, items, and markup percent are required" },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId) },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Validate and calculate totals
    let totalCost = 0;
    let totalPrice = 0;
    const itemsWithCalculatedPrices: Array<{
      productId: number;
      quantity: number;
      costPrice: number;
      salePrice: number;
    }> = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(item.productId) },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 404 }
        );
      }

      const quantity = parseInt(String(item.quantity));
      const costPrice = product.pricePerUnit;
      const salePrice =
        costPrice * (1 + parseFloat(String(markupPercent)) / 100);

      totalCost += costPrice * quantity;
      totalPrice += salePrice * quantity;

      itemsWithCalculatedPrices.push({
        productId: parseInt(String(item.productId)),
        quantity,
        costPrice,
        salePrice,
      });
    }

    // Create sale with items
    const sale = await prisma.sale.create({
      data: {
        customerId: parseInt(customerId),
        totalCost,
        totalPrice,
        markupPercent: parseFloat(String(markupPercent)),
        items: {
          create: itemsWithCalculatedPrices,
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 }
    );
  }
}

// DELETE bulk delete sales
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

    const result = await prisma.sale.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({ deleted: result.count }, { status: 200 });
  } catch (error) {
    console.error("Error deleting sales:", error);
    return NextResponse.json(
      { error: "Failed to delete sales" },
      { status: 500 }
    );
  }
}
