import { NextRequest } from "next/server";

export function getStoreIdFromRequest(request: NextRequest): number | null {
  const storeId = request.headers.get("x-store-id");
  return storeId ? parseInt(storeId) : null;
}
