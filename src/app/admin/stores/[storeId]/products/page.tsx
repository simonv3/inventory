"use client";

import { useParams } from "next/navigation";
import { ProductsManager } from "@/components/products/ProductsManager";

export default function StoreProductsPage() {
  const params = useParams();
  const storeId = parseInt(params.storeId as string);
  return <ProductsManager storeId={storeId} />;
}
