import type { ReactNode } from "react";

import { ProductGrid } from "@/components/product/ProductGrid";
import { Container } from "@/components/ui/Container";
import type { Product } from "@/lib/storefront/types";

import styles from "./ProductShelf.module.css";
import { SectionHeading } from "./SectionHeading";

/** Cards per home-page shelf; "Barchasi" opens the rest in the catalog. */
const SHELF_SIZE = 10;

/**
 * A home-page shelf: a heading and one swipeable row of cards. A collection
 * (Top, Yangi, Chegirma) sits on a dark band so it stands out from the
 * ordinary categories.
 */
export function ProductShelf({
  title,
  note,
  href,
  count,
  icon,
  products,
  highlight = false,
  eagerCount = 0,
  showCategory = false,
}: {
  title: string;
  note?: string;
  href?: string;
  count?: number;
  icon?: ReactNode;
  products: Product[];
  highlight?: boolean;
  eagerCount?: number;
  /** Shelves of one category leave it off the cards; mixed shelves (best sellers) keep it. */
  showCategory?: boolean;
}) {
  const content = (
    <Container className={styles.inner}>
      <SectionHeading title={title} note={note} href={href} count={count} icon={icon} tone={highlight ? "dark" : "light"} />
      <ProductGrid products={products.slice(0, SHELF_SIZE)} eagerCount={eagerCount} rail showCategory={showCategory} />
    </Container>
  );
  return highlight ? <section className={styles.band}>{content}</section> : <section className={styles.section}>{content}</section>;
}
