import { NO_FILTERS, SORT_OPTIONS, sizeFromParam, sizeParam, type CatalogFilters, type SortKey } from "@/lib/storefront/catalog";

export type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** Reads the catalog filters from the URL; anything malformed is ignored. */
export function parseFilters(params: SearchParams): CatalogFilters {
  const category = Number(first(params.category));
  const sort = first(params.sort) as SortKey;
  const size = first(params.size).trim();
  const finish = first(params.finish).trim();
  return {
    categoryId: first(params.category) && Number.isFinite(category) ? category : null,
    size: /^\d{1,3}(\.\d)?x\d{1,3}(\.\d)?$/i.test(size) ? sizeFromParam(size) : null,
    finish: /^[a-z]{2,16}$/.test(finish) ? finish : null,
    query: first(params.q).trim(),
    stockOnly: first(params.stock) === "1",
    saleOnly: first(params.sale) === "1",
    sort: SORT_OPTIONS.some((o) => o.key === sort) ? sort : "default",
  };
}

/** The catalog URL for `filters` with `patch` applied. */
export function catalogHref(filters: CatalogFilters, patch: Partial<CatalogFilters> = {}): string {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.categoryId != null) params.set("category", String(next.categoryId));
  if (next.size) params.set("size", sizeParam(next.size));
  if (next.finish) params.set("finish", next.finish);
  if (next.query) params.set("q", next.query);
  if (next.stockOnly) params.set("stock", "1");
  if (next.saleOnly) params.set("sale", "1");
  if (next.sort !== "default") params.set("sort", next.sort);
  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

/** How many narrowing filters are on, for the phone's "Filtrlar" badge. */
export function activeCount(f: CatalogFilters): number {
  return [f.categoryId != null, f.size, f.finish, f.stockOnly, f.saleOnly].filter(Boolean).length;
}

export const CLEARED: Partial<CatalogFilters> = {
  categoryId: NO_FILTERS.categoryId,
  size: NO_FILTERS.size,
  finish: NO_FILTERS.finish,
  stockOnly: false,
  saleOnly: false,
};
