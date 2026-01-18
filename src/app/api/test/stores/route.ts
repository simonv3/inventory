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
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Store name is required" },
        { status: 400 },
      );
    }

    const store = await prisma.store.create({
      data: {
        name,
      },
    });

    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    console.error("Error creating test store:", error);
    return NextResponse.json(
      { error: "Failed to create store" },
      { status: 500 },
    );
  }
}
