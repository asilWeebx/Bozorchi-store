"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Category, Product } from "./types";

interface CatalogContextValue {
  products: Product[];
  /** In the shop's order. */
  categories: Category[];
  categoryImages: Record<number, string>;
  /** Best sellers, for the "Ko‘p sotilgan" badge. */
  topIds: number[];
  showImages: boolean;
  showStock: boolean;
}

const CatalogContext = createContext<CatalogContextValue>({
  products: [],
  categories: [],
  categoryImages: {},
  topIds: [],
  showImages: true,
  showStock: true,
});

/**
 * The catalog, fetched once by the root layout, for client components that
 * need all of it: search suggestions, the category drawer and keeping the
 * saved cart in step with stock.
 */
export function CatalogProvider({ value, children }: { value: CatalogContextValue; children: ReactNode }) {
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  return useContext(CatalogContext);
}
