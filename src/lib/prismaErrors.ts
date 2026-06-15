import { NextResponse } from "next/server";

// Prisma error codes this app maps to user-facing responses.
// P2002: unique constraint violation, P2003: foreign key constraint failed,
// P2025: record not found. See https://www.prisma.io/docs/orm/reference/error-reference
export type PrismaErrorCode = "P2002" | "P2003" | "P2025";

interface ErrorResponse {
  message: string;
  status: number;
}

// Extracts the Prisma error code (e.g. "P2002") from an unknown thrown value.
export function getPrismaErrorCode(error: unknown): string | undefined {
  return (error as { code?: string } | null)?.code;
}

// Builds a NextResponse for the first matching Prisma error code, or returns
// null when the error isn't one of the provided codes so the caller can fall
// back to its own generic 500 response.
export function handlePrismaError(
  error: unknown,
  mappings: Partial<Record<PrismaErrorCode, ErrorResponse>>
): NextResponse | null {
  const code = getPrismaErrorCode(error);
  const mapping = code ? mappings[code as PrismaErrorCode] : undefined;
  if (mapping) {
    return NextResponse.json(
      { error: mapping.message },
      { status: mapping.status }
    );
  }
  return null;
}
