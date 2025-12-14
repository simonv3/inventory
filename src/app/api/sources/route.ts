import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all sources
export async function GET() {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(sources);
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

// POST create a new source
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Source name is required" },
        { status: 400 }
      );
    }

    const source = await prisma.source.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error("Error creating source:", error);
    const errorCode = (error as any)?.code;

    if (errorCode === "P2002") {
      return NextResponse.json(
        { error: "Source with this name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}
