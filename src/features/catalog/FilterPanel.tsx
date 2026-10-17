import Link from "next/link";

import { TileGlyph } from "@/components/layout/TileGlyph";
import { topCategories, type CatalogFilters } from "@/lib/storefront/catalog";
import type { Category } from "@/lib/storefront/types";

import styles from "./FilterPanel.module.css";
import { CLEARED, activeCount, catalogHref } from "./params";

export interface Facet {
  value: string;
  label: string;
  count: number;
  /** A tile size in cm, drawn to scale beside it. */
  shape?: { a: number; b: number };
}

/**
 * Section (the ERP's categories), tile size, surface and stock filters. Every option is a
 * link to the filtered URL, so filtering works before any script loads and
 * can be shared.
 */
export function FilterPanel({
  filters,
  categories,
  categoryCounts,
  sizes,
  finishes,
  hasSales,
}: {
  filters: CatalogFilters;
  categories: Category[];
  categoryCounts: Record<number, number>;
  sizes: Facet[];
  finishes: Facet[];
  hasSales: boolean;
}) {
  // Empty categories are noise; the chosen one stays so it can be cleared.
  const shown = (c: Category) => (categoryCounts[c.id] ?? 0) > 0 || c.id === filters.categoryId;
  const tops = topCategories(categories).filter(shown);

  return (
    <div className={styles.panel}>
      {tops.length > 1 && (
        <section className={styles.group}>
          <h2 className={styles.heading}>Bo‘limlar</h2>
          <ul className={styles.options}>
            <li>
              <Link href={catalogHref(filters, { categoryId: null })} className={styles.option} aria-current={filters.categoryId == null ? "true" : undefined} scroll={false}>
                Hammasi
              </Link>
            </li>
            {tops.map((c) => {
              const children = categories.filter((child) => child.parentId === c.id && shown(child));
              return (
                <li key={c.id}>
                  <Link href={catalogHref(filters, { categoryId: c.id })} className={styles.option} aria-current={filters.categoryId === c.id ? "true" : undefined} scroll={false}>
                    {c.label}
                    <span className={styles.count}>{categoryCounts[c.id] ?? 0}</span>
                  </Link>
                  {children.length > 0 && (
                    <ul className={styles.children}>
                      {children.map((child) => (
                        <li key={child.id}>
                          <Link href={catalogHref(filters, { categoryId: child.id })} className={styles.option} aria-current={filters.categoryId === child.id ? "true" : undefined} scroll={false}>
                            {child.label}
                            <span className={styles.count}>{categoryCounts[child.id] ?? 0}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {sizes.length > 1 && (
        <section className={styles.group}>
          <h2 className={styles.heading}>O‘lcham, sm</h2>
          <ul className={styles.sizes}>
            {sizes.map((s) => (
              <li key={s.value}>
                <Link
                  href={catalogHref(filters, { size: filters.size === s.value ? null : s.value })}
                  className={styles.size}
                  aria-pressed={filters.size === s.value}
                  aria-disabled={s.count === 0 && filters.size !== s.value ? true : undefined}
                  aria-label={`${s.label} sm, ${s.count} ta`}
                  scroll={false}
                >
                  {s.shape && <TileGlyph a={s.shape.a} b={s.shape.b} size={16} />}
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {finishes.length > 1 && (
        <section className={styles.group}>
          <h2 className={styles.heading}>Sirti</h2>
          <ul className={styles.chips}>
            {finishes.map((f) => (
              <li key={f.value}>
                <Link
                  href={catalogHref(filters, { finish: filters.finish === f.value ? null : f.value })}
                  className={styles.chip}
                  aria-pressed={filters.finish === f.value}
                  scroll={false}
                >
                  {f.label}
                  <span className={styles.chipCount}>{f.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.group}>
        <h2 className={styles.heading}>Ko‘rsatish</h2>
        <ul className={styles.options}>
          <li>
            <Link href={catalogHref(filters, { stockOnly: !filters.stockOnly })} className={styles.toggle} aria-pressed={filters.stockOnly} scroll={false}>
              <span className={styles.check} aria-hidden />
              Faqat sotuvdagilar
            </Link>
          </li>
          {hasSales && (
            <li>
              <Link href={catalogHref(filters, { saleOnly: !filters.saleOnly })} className={styles.toggle} aria-pressed={filters.saleOnly} scroll={false}>
                <span className={styles.check} aria-hidden />
                Chegirmadagilar
              </Link>
            </li>
          )}
        </ul>
      </section>

      {activeCount(filters) > 0 && (
        <Link href={catalogHref(filters, CLEARED)} className={styles.reset}>
          Filtrlarni tozalash
        </Link>
      )}
    </div>
  );
}
