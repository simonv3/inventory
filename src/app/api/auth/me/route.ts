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

    // Fetch customer from database
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
    });
  } catch (error) {
    console.error("Error getting customer:", error);
    return NextResponse.json(
      { error: "Failed to get customer" },
      { status: 500 }
    );
  }
}
