import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { displayPrice, isOutOfStock, productOptions } from "@/lib/shop/options";
import { hasSize, sizeFacets, sizeParam } from "@/lib/storefront/catalog";
import { priceText } from "@/lib/storefront/currency";
import type { Product } from "@/lib/storefront/types";

import { SectionHeading } from "./SectionHeading";
import styles from "./SizeStrip.module.css";

/** The cheapest price per unit among a size's tiles in stock, in its own currency. */
function fromPrice(products: Product[]): string | null {
  const options = products.filter((p) => !isOutOfStock(p)).flatMap((p) => productOptions(p).filter((o) => o.inStock));
  const best = displayPrice(options)?.option;
  return best ? `${priceText(best.curPrice, best.currency)} / ${best.unit} dan` : null;
}

/**
 * The way most people shop for tiles: by format. Each size is drawn to
 * scale (a 60×120 plank, a 60×60 square), with how many products come in it
 * and the lowest price.
 */
export function SizeStrip({ products }: { products: Product[] }) {
  const sizes = sizeFacets(products);
  if (sizes.length < 2) return null;
  const largest = Math.max(...sizes.map((s) => Math.max(s.a, s.b)));

  return (
    <Container className={styles.section}>
      <SectionHeading title="O‘lcham bo‘yicha tanlang" note="Rasmlar o‘lchamlar nisbatida chizilgan" />
      <ul className={styles.list}>
        {sizes.map((size) => {
          const inSize = products.filter((p) => hasSize(p, size.label));
          const price = fromPrice(inSize);
          // Long side across the card; scaled against the largest tile so sizes compare.
          const long = Math.max(size.a, size.b);
          const short = Math.min(size.a, size.b);
          return (
            <li key={size.label}>
              <Link href={`/catalog?size=${sizeParam(size.label)}`} className={styles.card}>
                <span className={styles.stage} aria-hidden>
                  <span className={styles.tile} style={{ width: `${(long / largest) * 100}%`, aspectRatio: `${long} / ${short}` }} />
                </span>
                <span className={styles.label}>{size.label}</span>
                <span className={styles.meta}>
                  {inSize.length} ta{price && <> · {price}</>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
