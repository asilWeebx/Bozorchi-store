import type { Product } from "@/lib/storefront/types";

import { ProductCard } from "./ProductCard";
import styles from "./ProductGrid.module.css";

/**
 * Cards in a grid, or with `rail` in one swipeable row. `narrow` keeps four
 * columns on wide screens, for a grid that shares the row with a sidebar.
 * `showCategory: false` drops the maker line from cards that all share one.
 */
export function ProductGrid({
  products,
  eagerCount = 0,
  rail = false,
  narrow = false,
  showCategory = true,
}: {
  products: Product[];
  eagerCount?: number;
  rail?: boolean;
  narrow?: boolean;
  showCategory?: boolean;
}) {
  return (
    <ul className={[styles.grid, rail && styles.rail, narrow && styles.narrow].filter(Boolean).join(" ")}>
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} eager={index < eagerCount} showCategory={showCategory} />
        </li>
      ))}
    </ul>
  );
}
