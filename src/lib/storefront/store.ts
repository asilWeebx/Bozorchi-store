import "server-only";

import { cache } from "react";

import { BRAND } from "@/config/store";

import { buildCategories, categoryImageMap, normalizeCategories, productsInCategory, rankTopProducts } from "./catalog";
import { StorefrontError, getCatalog, getStoreInfo, getTopProductIds, media } from "./client";
import { normalizeBanners } from "./presentation";
import type { CatalogResponse, Category, Product, StoreBanner, StoreInfo } from "./types";

/**
 * Why the storefront has no data. A rejected key needs a person to fix the
 * configuration; a network blip resolves itself.
 */
export type FailureReason = "auth" | "unavailable";

export interface StoreSummary {
  /** The brand ("Kafel Baraka"). */
  name: string;
  /** The ERP organization ("Kafel baraka"), for the footer. */
  organization: string;
  /** ERP banners only; the home page has its own slides when there are none. */
  banners: StoreBanner[];
  configured: boolean;
  reason?: FailureReason;
  error?: string;
}

export interface CatalogView {
  products: Product[];
  /** In the shop's order (see `orderCategories`). */
  categories: Category[];
  /** A photo per category: the ERP's own, else its first product's. */
  categoryImages: Record<number, string>;
  topProducts: Product[];
  showImages: boolean;
  showStock: boolean;
  configured: boolean;
  reason?: FailureReason;
  error?: string;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : "Do'kon ma'lumotlari yuklanmadi";
}

function classify(error: unknown): FailureReason {
  if (error instanceof StorefrontError && [401, 403, 500].includes(error.status)) return "auth";
  return "unavailable";
}

function summarize(info: StoreInfo): StoreSummary {
  return {
    name: BRAND.name,
    organization: info.organization?.trim() || BRAND.name,
    banners: normalizeBanners(info.banners ?? [], media),
    configured: true,
  };
}

/**
 * Image URLs arrive absolute (the CDN) or relative to the API host; resolving
 * them here means components only ever see absolute URLs. Categories are
 * normalized and ordered here too, so every page reads the same list.
 */
function view(raw: CatalogResponse, topIds: number[]): CatalogView {
  const products = normalizeCategories(
    (raw.results ?? []).map((product) => ({
      ...product,
      name: product.name?.trim() || "Nomsiz mahsulot",
      image: media(product.image),
      images: product.images?.map(media).filter(Boolean),
      variants: (product.variants ?? []).map((v) => ({ ...v, image: media(v.image) || null })),
      units: product.units ?? [],
      attributes: product.attributes ?? {},
    })),
  );

  const categories = buildCategories(products, raw.categories ?? []);
  const images = categoryImageMap((raw.category_images ?? []).map((c) => ({ ...c, image: media(c.image) })));
  for (const category of categories) {
    images[category.id] ||= productsInCategory(products, category.id).find((p) => p.image)?.image || "";
  }
  return {
    products,
    categories,
    categoryImages: images,
    topProducts: rankTopProducts(topIds, products),
    showImages: raw.show_images !== false,
    showStock: raw.show_stock !== false,
    configured: true,
  };
}

/** A failed call must not blank the site; the page says why instead. */
export const getStore = cache(async (): Promise<StoreSummary> => {
  try {
    return summarize(await getStoreInfo());
  } catch (error) {
    return {
      name: BRAND.name,
      organization: BRAND.name,
      banners: [],
      configured: false,
      reason: classify(error),
      error: describe(error),
    };
  }
});

/**
 * The catalog, its categories and the best sellers. The API has no
 * per-product endpoint, so every page that needs a product reads this list.
 */
export const getCatalogView = cache(async (customerCode?: string): Promise<CatalogView> => {
  try {
    const [raw, top] = await Promise.all([
      getCatalog(customerCode),
      // Best sellers are a nice-to-have; never fail the page over them.
      getTopProductIds(12).catch(() => ({ product_ids: [] })),
    ]);
    return view(raw, top.product_ids ?? []);
  } catch (error) {
    return {
      products: [],
      categories: [],
      categoryImages: {},
      topProducts: [],
      showImages: true,
      showStock: true,
      configured: false,
      reason: classify(error),
      error: describe(error),
    };
  }
});

export const findProduct = cache(async (id: number, customerCode?: string) => {
  const { products } = await getCatalogView(customerCode);
  return products.find((product) => product.id === id) ?? null;
});
