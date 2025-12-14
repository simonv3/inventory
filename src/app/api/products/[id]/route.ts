import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET single product with categories and source
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        source: true,
        inventoryReceived: { orderBy: { receivedDate: "desc" } },
        saleItems: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Format response to flatten categories
    return NextResponse.json({
      ...product,
      categories: product.categories.map((pc) => pc.category),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const productId = parseInt(id);

    // Handle category updates separately
    if (body.categoryIds) {
      // Delete existing category associations
      await prisma.productCategory.deleteMany({
        where: { productId },
      });

      // Create new associations
      if (body.categoryIds.length > 0) {
        await prisma.productCategory.createMany({
          data: body.categoryIds.map((categoryId: number) => ({
            productId,
            categoryId,
          })),
        });
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.isOrganic !== undefined && { isOrganic: body.isOrganic }),
        ...(body.showInStorefront !== undefined && {
          showInStorefront: body.showInStorefront,
        }),
        ...(body.unitOfMeasurement && {
          unitOfMeasurement: body.unitOfMeasurement,
        }),
        ...(body.pricePerUnit !== undefined && {
          pricePerUnit: parseFloat(body.pricePerUnit),
        }),
        ...(body.minimumStock !== undefined && {
          minimumStock: parseInt(body.minimumStock),
        }),
        ...(body.sourceId && { sourceId: parseInt(body.sourceId) }),
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        source: true,
      },
    });

    // Format response to flatten categories
    return NextResponse.json({
      ...product,
      categories: product.categories.map((pc) => pc.category),
    });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
