import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";
import { sizeFacets, sizeParam, topCategories } from "@/lib/storefront/catalog";
import { getCatalogView } from "@/lib/storefront/store";

/* Rendered per request, so it always lists the live catalog. */
export const dynamic = "force-dynamic";

/** Home, the catalog, each maker and tile size, and every product, from the live catalog. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getCatalogView();
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/catalog`, changeFrequency: "daily", priority: 0.9 },
    ...topCategories(categories).map((c) => ({ url: `${SITE_URL}/catalog?category=${c.id}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...sizeFacets(products).map((s) => ({ url: `${SITE_URL}/catalog?size=${sizeParam(s.label)}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.id}`, changeFrequency: "daily" as const, priority: 0.7 })),
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
