import Link from "next/link";

import { topCategories, type CatalogFilters } from "@/lib/storefront/catalog";
import type { Category } from "@/lib/storefront/types";

import styles from "./CategoryChips.module.css";
import { catalogHref } from "./params";

/**
 * One swipeable row over the results on phones: everything, the makers and
 * the tile sizes. Wide screens have the sidebar instead.
 */
export function CategoryChips({ filters, categories, sizes, total }: { filters: CatalogFilters; categories: Category[]; sizes: string[]; total: number }) {
  const tops = topCategories(categories);
  if (tops.length + sizes.length < 2) return null;
  const current = categories.find((c) => c.id === filters.categoryId);
  const activeTop = current?.parentId ?? current?.id ?? null;
  const nothing = activeTop == null && !filters.size;
  return (
    <nav className={styles.row} aria-label="Tezkor filtrlar">
      <ul className={styles.list}>
        <li>
          <Link href={catalogHref(filters, { categoryId: null, size: null })} className={styles.chip} aria-current={nothing ? "true" : undefined} scroll={false}>
            Hammasi
            <span className={styles.count}>{total}</span>
          </Link>
        </li>
        {tops.map((c) => (
          <li key={c.id}>
            <Link href={catalogHref(filters, { categoryId: activeTop === c.id ? null : c.id })} className={styles.chip} aria-current={activeTop === c.id ? "true" : undefined} scroll={false}>
              {c.label}
            </Link>
          </li>
        ))}
        {sizes.map((size) => (
          <li key={size}>
            <Link href={catalogHref(filters, { size: filters.size === size ? null : size })} className={styles.chip} aria-current={filters.size === size ? "true" : undefined} scroll={false}>
              {size}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
