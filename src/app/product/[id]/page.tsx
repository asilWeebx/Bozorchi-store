import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Container } from "@/components/ui/Container";
import { ProductDetail } from "@/features/product/ProductDetail";
import { getCustomerCode } from "@/lib/customer/session";
import { displayPrice, productOptions } from "@/lib/shop/options";
import { tileFacts } from "@/lib/shop/tiles";
import { productMaker, similarProducts } from "@/lib/storefront/catalog";
import { fmtNumber, priceText } from "@/lib/storefront/currency";
import { findProduct, getCatalogView, getStore } from "@/lib/storefront/store";

import styles from "./page.module.css";

type Params = Promise<{ id: string }>;
type Search = Promise<{ o?: string | string[] }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const product = await findProduct(Number(id), await getCustomerCode());
  if (!product) return { title: "Mahsulot topilmadi" };
  const facts = tileFacts(product);
  const price = displayPrice(productOptions(product));
  const box = price?.option.box;
  const title = [product.name, facts.size?.label, facts.finish?.label].filter(Boolean).join(" · ");
  const description =
    product.description?.trim() ||
    [
      facts.size ? `Kafel ${facts.size.label} sm` : product.name,
      facts.finish?.label.toLowerCase(),
      productMaker(product),
      price ? `${priceText(price.option.curPrice, price.option.currency)}${price.varies ? " dan" : ""} / ${price.option.unit}` : null,
      box && price?.option.measure === "area" ? `qutida ${fmtNumber(box.pieces)} dona, ${fmtNumber(box.qty)} m²` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  return {
    title,
    description,
    openGraph: { title, description, images: product.image ? [product.image] : undefined },
  };
}

export default async function ProductPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ id }, { o }] = await Promise.all([params, searchParams]);
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const customerCode = await getCustomerCode();
  const [product, catalog, store] = await Promise.all([findProduct(productId, customerCode), getCatalogView(customerCode), getStore()]);

  if (!catalog.configured) {
    return (
      <Container>
        <SetupNotice reason={catalog.reason ?? store.reason} error={catalog.error ?? store.error} />
      </Container>
    );
  }
  if (!product) notFound();

  const similar = similarProducts(product, catalog.products, 10);
  const top = catalog.categories.find((c) => c.id === (product.category_parent_id ?? product.category_id));
  const own = product.category_parent_id ? catalog.categories.find((c) => c.id === product.category_id) : undefined;
  const link = (c: { id: number; label: string } | undefined) => (c ? { label: c.label, href: `/catalog?category=${c.id}` } : null);
  const optionKey = Array.isArray(o) ? o[0] : o;

  return (
    <Container className={styles.page}>
      <Breadcrumbs
        items={[
          { label: "Bosh sahifa", href: "/" },
          { label: "Katalog", href: "/catalog" },
          ...[top, own].filter((c) => c != null).map((c) => ({ label: c.label, href: `/catalog?category=${c.id}` })),
          { label: product.name },
        ]}
      />

      <ProductDetail key={product.id} product={product} initialOption={optionKey ?? null} maker={link(top)} section={link(own)} />

      {similar.length > 0 && (
        <section className={styles.similar}>
          <h2 className={styles.similarTitle}>O‘xshash kafellar</h2>
          <ProductGrid products={similar} rail />
        </section>
      )}
    </Container>
  );
}
