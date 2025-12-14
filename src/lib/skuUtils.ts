/**
 * Generate a consistent SKU from a product name
 * SKU format: First 8 chars of product name (cleaned) + random 4-char code
 * Example: "Organic Apples" => "ORGANIC-A1K2"
 */
export function generateSKU(productName: string): string {
  const cleaned = productName
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toUpperCase()
    .substring(0, 8);

  const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `${cleaned}-${randomCode}`;
}

/**
 * Validate SKU format
 * SKU must be 1-20 characters, alphanumeric with hyphens
 */
export function validateSKU(sku: string): boolean {
  const skuRegex = /^[A-Z0-9-]{1,20}$/;
  return skuRegex.test(sku);
}

/**
 * Parse error messages that might indicate SKU conflicts
 */
export function isSKUConflictError(error: any): boolean {
  if (!error) return false;

  const errorMsg = error?.message || error?.error || "";
  const errorCode = error?.code || "";

  return (
    errorCode === "P2002" || // Prisma unique constraint violation
    errorMsg.toLowerCase().includes("sku") ||
    errorMsg.toLowerCase().includes("unique")
  );
}
