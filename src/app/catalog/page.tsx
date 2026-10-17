import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryChips } from "@/features/catalog/CategoryChips";
import { FilterPanel } from "@/features/catalog/FilterPanel";
import { FiltersDrawer } from "@/features/catalog/FiltersDrawer";
import { activeCount, catalogHref, parseFilters, type SearchParams } from "@/features/catalog/params";
import { SortSelect } from "@/features/catalog/SortSelect";
import { getCustomerCode } from "@/lib/customer/session";
import {
  filterProducts,
  finishFacets,
  hasFinish,
  hasSize,
  isDiscounted,
  productsInCategory,
  searchSuggestions,
  sizeFacets,
  type CatalogFilters,
} from "@/lib/storefront/catalog";
import { getCatalogView, getStore } from "@/lib/storefront/store";
import type { Category, Product } from "@/lib/storefront/types";

import styles from "./page.module.css";

const ALL = "Barcha mahsulotlar";

/** "Qo‘qon kafel · 60×120 · Glans", or everything. */
function pageTitle(filters: CatalogFilters, category: Category | null, products: Product[]): string {
  const finish = filters.finish ? finishFacets(products).find((f) => f.id === filters.finish)?.label : null;
  return [category?.label, filters.size, finish].filter(Boolean).join(" · ") || ALL;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  const { categories, products } = await getCatalogView(await getCustomerCode());
  const category = categories.find((c) => c.id === filters.categoryId) ?? null;
  const title = filters.query ? `“${filters.query}”` : pageTitle(filters, category, products);
  return { title, description: `${title}: kafel va keramogranit, narxi m² hisobida, qutidagi dona va m² bilan, onlayn buyurtma.` };
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseFilters(await searchParams);
  const customerCode = await getCustomerCode();
  const [store, catalog] = await Promise.all([getStore(), getCatalogView(customerCode)]);

  if (!catalog.configured) {
    return (
      <Container>
        <SetupNotice reason={catalog.reason ?? store.reason} error={catalog.error ?? store.error} />
      </Container>
    );
  }

  const { products } = catalog;
  const category = catalog.categories.find((c) => c.id === filters.categoryId) ?? null;
  const results = filterProducts(products, filters);
  const suggestions = results.length === 0 && filters.query ? searchSuggestions(filters.query, products) : [];

  // Each filter's counts are taken with the other filters applied, so a number matches what a click shows.
  const forCategories = filterProducts(products, { ...filters, categoryId: null });
  const categoryCounts = Object.fromEntries(catalog.categories.map((c) => [c.id, productsInCategory(forCategories, c.id).length]));
  const forSizes = filterProducts(products, { ...filters, size: null });
  const sizes = sizeFacets(products).map((s) => ({ value: s.label, label: s.label, count: forSizes.filter((p) => hasSize(p, s.label)).length, shape: { a: s.a, b: s.b } }));
  const forFinishes = filterProducts(products, { ...filters, finish: null });
  const finishes = finishFacets(products)
    .map((f) => ({ value: f.id, label: f.label, count: forFinishes.filter((p) => hasFinish(p, f.id)).length }))
    .filter((f) => f.count > 0 || f.value === filters.finish);

  const title = filters.query ? `“${filters.query}”` : pageTitle(filters, category, products);
  const filtered = results.length !== products.length;

  return (
    <Container className={styles.page}>
      <Breadcrumbs
        items={[
          { label: "Bosh sahifa", href: "/" },
          { label: "Katalog", href: filtered ? "/catalog" : undefined },
          ...(title !== ALL ? [{ label: title }] : []),
        ]}
      />

      <div className={styles.head}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.count}>{results.length} ta mahsulot</p>
        {category?.note && !filters.query && <p className={styles.note}>{category.note}</p>}
      </div>

      <CategoryChips filters={filters} categories={catalog.categories} sizes={sizes.map((s) => s.value)} total={products.length} />

      <div className={styles.layout}>
        <aside className={styles.aside}>
          <Suspense>
            <FiltersDrawer activeCount={activeCount(filters)}>
              <FilterPanel
                filters={filters}
                categories={catalog.categories}
                categoryCounts={categoryCounts}
                sizes={sizes}
                finishes={finishes}
                hasSales={products.some(isDiscounted)}
              />
            </FiltersDrawer>
          </Suspense>
          <div className={styles.sortMobile}>
            <SortSelect filters={filters} />
          </div>
        </aside>

        <div className={styles.results}>
          <div className={styles.toolbar}>
            {filters.query ? (
              <Link href={catalogHref(filters, { query: "" })} className={styles.clearQuery}>
                Qidiruvni bekor qilish
              </Link>
            ) : (
              <span />
            )}
            <SortSelect filters={filters} />
          </div>

          {results.length > 0 ? (
            <ProductGrid products={results} eagerCount={4} narrow showCategory={!category} />
          ) : (
            <>
              <EmptyState
                icon={<SearchX size={32} aria-hidden />}
                title="Hech narsa topilmadi"
                text="Filtrlarni o‘zgartirib ko‘ring yoki kod va o‘lcham bilan qidiring: masalan, «8230» yoki «60x120»."
                action={
                  <ButtonLink href="/catalog" variant="secondary">
                    {ALL}
                  </ButtonLink>
                }
              />
              {suggestions.length > 0 && (
                <section className={styles.suggestions}>
                  <h2 className={styles.suggestionsTitle}>Balki shular kerakdir</h2>
                  <ProductGrid products={suggestions} narrow />
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
