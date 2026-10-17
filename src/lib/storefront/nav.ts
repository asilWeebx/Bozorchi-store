import { productsInCategory, sizeFacets, sizeParam, topCategories } from "./catalog.ts";
import type { Category, Product } from "./types";

/** A way into the catalog: an ERP category (a maker) or a tile size. */
export interface ShopLink {
  key: string;
  kind: "category" | "size";
  href: string;
  label: string;
  /** The bracketed part of a category name. */
  note: string;
  count: number;
  /** For sizes, in cm, to draw the tile to scale. */
  shape: { a: number; b: number } | null;
}

/**
 * The catalog's entrances, in the order the header, the catalog sheet and
 * the footer list them: the shop's own top categories (its makers:
 * "Sirdaryo kafel", "Qo‘qon kafel", ...), then the tile sizes, smallest first.
 */
export function shopLinks(categories: Category[], products: Product[]): ShopLink[] {
  const fromCategories: ShopLink[] = topCategories(categories).map((c) => ({
    key: `c${c.id}`,
    kind: "category",
    href: `/catalog?category=${c.id}`,
    label: c.label,
    note: c.note,
    count: productsInCategory(products, c.id).length,
    shape: null,
  }));
  const fromSizes: ShopLink[] = sizeFacets(products).map((s) => ({
    key: `s${s.label}`,
    kind: "size",
    href: `/catalog?size=${sizeParam(s.label)}`,
    label: s.label,
    note: "",
    count: s.count,
    shape: { a: s.a, b: s.b },
  }));
  return [...fromCategories, ...fromSizes];
}
