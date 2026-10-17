"use client";

import { useEffect } from "react";

import { useCatalog } from "@/lib/storefront/CatalogProvider";

import { useCart } from "./useCart";

/**
 * Re-checks the saved cart whenever a fresh catalog arrives, so prices and
 * stock caps follow the ERP. Renders nothing.
 */
export function CartSync() {
  const { products } = useCatalog();
  const { ready, syncProducts } = useCart();

  useEffect(() => {
    if (ready) syncProducts(products);
  }, [ready, products, syncProducts]);

  return null;
}
