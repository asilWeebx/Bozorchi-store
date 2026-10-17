"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

import { SORT_OPTIONS, type CatalogFilters, type SortKey } from "@/lib/storefront/catalog";

import { catalogHref } from "./params";
import styles from "./SortSelect.module.css";

export function SortSelect({ filters }: { filters: CatalogFilters }) {
  const router = useRouter();
  return (
    <label className={styles.wrap}>
      <span className="sr-only">Saralash</span>
      <select
        className={styles.select}
        value={filters.sort}
        onChange={(event) =>
          router.push(catalogHref(filters, { sort: event.target.value as SortKey }), { scroll: false })
        }
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className={styles.chevron} aria-hidden />
    </label>
  );
}
