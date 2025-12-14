import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const customerTypes = await prisma.customerType.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(customerTypes);
  } catch (error) {
    console.error("Error fetching customer types:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer types" },
      { status: 500 }
    );
  }
}
