import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("customerToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decode token to get customer ID
    const decodedToken = JSON.parse(
      Buffer.from(token, "base64").toString("utf-8")
    );
    const customerId = decodedToken.customerId;

    // Get customer with their store associations
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        stores: {
          include: {
            store: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // If admin, return all stores
    if (customer.isAdmin) {
      const stores = await prisma.store.findMany({
        orderBy: { name: "asc" },
        include: { products: true },
      });
      return NextResponse.json(stores);
    }

    // If store manager, return only their managed stores
    const managedStoreIds = customer.stores
      .filter((cs) => cs.storeManager)
      .map((cs) => cs.store.id);

    if (managedStoreIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const stores = await prisma.store.findMany({
      where: {
        id: {
          in: managedStoreIds,
        },
      },
      orderBy: { name: "asc" },
      include: { products: true },
    });

    return NextResponse.json(stores);
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { error: "Failed to fetch stores" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Store name is required" },
        { status: 400 }
      );
    }

    const store = await prisma.store.create({
      data: { name },
      include: { products: true },
    });

    return NextResponse.json(store, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Store name already exists" },
        { status: 400 }
      );
    }
    console.error("Error creating store:", error);
    return NextResponse.json(
      { error: "Failed to create store" },
      { status: 500 }
    );
  }
}
