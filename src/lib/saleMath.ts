import { Product } from "@/types";

export interface SaleItemInput {
  productId: string;
  quantity: string;
  quantityOz?: string;
}

/**
 * Effective quantity in the product's base unit. For products measured in
 * pounds, an optional ounces field is folded in (1 lb = 16 oz).
 */
export function effectiveQuantity(
  product: Product | undefined,
  quantity?: string,
  quantityOz?: string,
): number {
  let q = parseFloat(quantity || "0");
  if (product?.unitOfMeasurement === "lb" && quantityOz) {
    q += parseFloat(quantityOz) / 16;
  }
  return q;
}

/** Per-unit sale price after applying the markup percentage. */
export function unitSalePrice(costPrice: number, markupPercent: number): number {
  return costPrice * (1 + markupPercent / 100);
}

export interface OrderTotals {
  subtotal: number;
  costSubtotal: number;
  markupAmount: number;
  total: number;
}

/** Roll up cost, markup and total across all line items. */
export function computeOrderTotals(
  items: SaleItemInput[],
  products: Product[],
  markupPercent: number,
): OrderTotals {
  let subtotal = 0;
  for (const item of items) {
    const product = products.find((p) => p.id === parseInt(item.productId || "0"));
    if (!product) continue;
    const salePrice = unitSalePrice(product.pricePerUnit || 0, markupPercent);
    subtotal += salePrice * effectiveQuantity(product, item.quantity, item.quantityOz);
  }
  const costSubtotal = subtotal / (1 + markupPercent / 100);
  return {
    subtotal,
    costSubtotal,
    markupAmount: subtotal - costSubtotal,
    total: subtotal,
  };
}
