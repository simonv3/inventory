import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Get the current user from the cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("customerToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Decode the token to get the current user's ID
    // The token format is base64-encoded JSON: {customerId, email, timestamp}
    let currentCustomerId: number;
    try {
      const decodedToken = JSON.parse(
        Buffer.from(token, "base64").toString("utf-8")
      );
      currentCustomerId = decodedToken.customerId;
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      );
    }

    // Get the current customer and verify they are an admin
    const currentCustomer = await prisma.customer.findUnique({
      where: { id: currentCustomerId },
    });

    if (!currentCustomer || !currentCustomer.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can use login as" },
        { status: 403 }
      );
    }

    // Get the target customer ID from the request body
    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 }
      );
    }

    // Verify the target customer exists
    const targetCustomer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId) },
      include: {
        stores: {
          include: {
            store: true,
            customerType: true,
          },
        },
      },
    });

    if (!targetCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Create a new token for the target customer
    const newToken = Buffer.from(
      JSON.stringify({
        customerId: targetCustomer.id,
        email: targetCustomer.email,
        timestamp: Date.now(),
      })
    ).toString("base64");

    // Set the cookie for the target customer
    const response = NextResponse.json({
      id: targetCustomer.id,
      name: targetCustomer.name,
      email: targetCustomer.email,
      isAdmin: targetCustomer.isAdmin,
      stores: targetCustomer.stores,
    });

    response.cookies.set("customerToken", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in login-as:", error);
    return NextResponse.json(
      { error: "Failed to login as customer" },
      { status: 500 }
    );
  }
}
