import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otpCode } = body;

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: "Email and OTP code are required" },
        { status: 400 }
      );
    }

    // Find customer by email
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check if OTP exists and is not expired
    if (!customer.otpCode || !customer.otpExpiresAt) {
      return NextResponse.json({ error: "No OTP requested" }, { status: 400 });
    }

    if (new Date() > customer.otpExpiresAt) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 401 });
    }

    // Verify OTP
    if (customer.otpCode !== otpCode) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 401 });
    }

    // Clear OTP after successful verification
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    // Create a session token
    const token = Buffer.from(
      JSON.stringify({
        customerId: customer.id,
        email: customer.email,
        timestamp: Date.now(),
      })
    ).toString("base64");

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only cookie with token (7 days expiration)
    response.cookies.set("customerToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
