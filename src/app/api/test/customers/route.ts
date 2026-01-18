import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Only allow in development and test environments
function isTestEnvironment() {
  return (
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
  );
}

export async function POST(request: NextRequest) {
  // Check if test environment
  if (!isTestEnvironment()) {
    return NextResponse.json(
      { error: "Test endpoints only available in development" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { email, name, isAdmin } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "Customer already exists" },
        { status: 400 },
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        email,
        name: name || email.split("@")[0],
        isAdmin: isAdmin || false,
      },
      include: {
        stores: {
          include: {
            store: true,
            customerType: true,
          },
        },
      },
    });

    console.log("Created test customer:", customer);

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating test customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 },
    );
  }
}
