"use client";

import { useCallback, useSyncExternalStore } from "react";

import { createPersistentStore } from "@/lib/persistent-store";
import type { BuyOption } from "@/lib/shop/options";
import { useCatalog } from "@/lib/storefront/CatalogProvider";
import type { Product } from "@/lib/storefront/types";

import { addLine, removeLine, revalidateCart, sanitizeStoredCart, setLineQty } from "./lines";
import type { CartItem } from "./types";

/**
 * The cart lives in localStorage, outside React, so it survives reloads and
 * reads the same on every page without a provider.
 */
const store = createPersistentStore<CartItem[]>("kb_cart", [], sanitizeStoredCart);

export function useCart() {
  const { products } = useCatalog();
  const { value: items, ready } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const add = useCallback(
    (product: Product, option: BuyOption, qty: number) =>
      store.set((current) => revalidateCart(addLine(current, product, option, qty), products)),
    [products],
  );
  const setQty = useCallback(
    (key: string, qty: number) => store.set((current) => revalidateCart(setLineQty(current, key, qty), products)),
    [products],
  );
  const remove = useCallback((key: string) => store.set((current) => revalidateCart(removeLine(current, key), products)), [products]);
  const clear = useCallback(() => store.set(() => []), []);

  /** Refreshes saved lines against the catalog after sign-in or an ERP update. */
  const syncProducts = useCallback((latest: Product[]) => store.set((current) => revalidateCart(current, latest)), []);

  /** Distinct lines, for the header badge. */
  const count = items.length;

  return { items, count, ready, add, setQty, remove, clear, syncProducts };
}
