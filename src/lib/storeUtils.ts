import { NextRequest } from "next/server";

export function getStoreIdFromRequest(request: NextRequest): number | null {
  // Check header first (for API requests with credentials)
  const storeIdHeader = request.headers.get("x-store-id");
  if (storeIdHeader) return parseInt(storeIdHeader);

  // Check query parameter
  const storeIdQuery = request.nextUrl.searchParams.get("storeId");
  if (storeIdQuery) return parseInt(storeIdQuery);

  return null;
}
