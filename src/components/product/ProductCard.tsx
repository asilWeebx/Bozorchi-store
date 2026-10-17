"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { SafeImage } from "@/components/ui/SafeImage";
import { Stepper } from "@/components/ui/Stepper";
import { cartFeedback } from "@/lib/cart/feedback";
import { lineHref, lineKey, packText } from "@/lib/cart/lines";
import { commitQty, stepQty } from "@/lib/cart/quantity";
import { useCart } from "@/lib/cart/useCart";
import { displayPrice, productOptions, type BuyOption } from "@/lib/shop/options";
import { tileFacts } from "@/lib/shop/tiles";
import { productMaker } from "@/lib/storefront/catalog";
import { useCatalog } from "@/lib/storefront/CatalogProvider";
import type { Product } from "@/lib/storefront/types";

import styles from "./ProductCard.module.css";
import { QuickBuy } from "./QuickBuy";
import { TileArt } from "./TileArt";

export function productHref(p: Product, option?: BuyOption | null) {
  return option && option.key !== "base" ? lineHref({ product_id: p.id, option_key: option.key }) : `/product/${p.id}`;
}

/**
 * A tile on the shelf: photo (or the tile drawn to scale), maker, code, size
 * and surface, the price per m² and per box. A tile sold as one item is added
 * straight from here, a box at a time; a series with several models opens a
 * quick chooser.
 */
export function ProductCard({ product, eager = false, showCategory = true }: { product: Product; eager?: boolean; showCategory?: boolean }) {
  const { showImages, topIds } = useCatalog();
  const { items, ready, add, setQty, remove } = useCart();
  const [quick, setQuick] = useState(false);
  const closeQuick = useCallback(() => setQuick(false), []);

  const facts = tileFacts(product);
  const options = productOptions(product);
  const price = displayPrice(options);
  const single = options.length === 1 ? options[0] : null;
  const soldOut = !options.some((o) => o.inStock);
  const bestseller = topIds.includes(product.id);
  const discount = price?.option.originalPrice != null ? Math.round((1 - price.option.price / price.option.originalPrice) * 100) : 0;
  const href = productHref(product);
  const maker = showCategory ? productMaker(product) : null;
  const art = <TileArt size={facts.size} glossy={facts.finish?.id === "glans" || facts.finish?.id === "polirovka"} />;

  const line = single && ready ? items.find((x) => x.key === lineKey(product.id, single.key)) : undefined;
  const inCart = ready ? items.filter((x) => x.product_id === product.id) : [];
  const limits = line ? { min: line.min_qty, grain: line.grain, step: line.step, max: line.max_qty } : undefined;
  const pack = line ? packText(line) : "";

  return (
    <article className={`${styles.card} ${soldOut ? styles.soldOut : ""}`}>
      <Link href={href} className={styles.media} tabIndex={-1} aria-hidden>
        {showImages ? (
          <SafeImage
            src={product.image}
            alt=""
            className={styles.photo}
            sizes="(min-width: 1280px) 280px, (min-width: 1024px) 23vw, (min-width: 640px) 31vw, 46vw"
            eager={eager}
            fallback={art}
          />
        ) : (
          art
        )}
      </Link>
      <div className={styles.badges}>
        {soldOut ? (
          <span className={`${styles.badge} ${styles.badgeMuted}`}>Tugagan</span>
        ) : (
          <>
            {bestseller && <span className={`${styles.badge} ${styles.badge_top}`}>Ko‘p sotilgan</span>}
            {discount > 0 && <span className={`${styles.badge} ${styles.badge_sale}`}>−{discount}%</span>}
          </>
        )}
      </div>

      <div className={styles.body}>
        {maker && <p className={styles.meta}>{maker}</p>}
        <h3 className={styles.name}>
          <Link href={href}>{product.name}</Link>
        </h3>
        {(facts.size || facts.finish || options.length > 1) && (
          <ul className={styles.tags}>
            {facts.size && <li className={styles.tagSize}>{facts.size.label}</li>}
            {facts.finish && <li>{facts.finish.label}</li>}
            {options.length > 1 && <li>{options.length} model</li>}
          </ul>
        )}

        <div className={styles.footer}>
          {price && (
            <Price
              amount={price.option.curPrice}
              currency={price.option.currency}
              inSom={price.option.price}
              original={price.option.curOriginalPrice}
              from={price.varies}
              per={price.option.unit}
              box={price.option.box && price.option.measure === "area" ? { qty: price.option.box.qty, unit: price.option.unit } : null}
              size="md"
            />
          )}

          <div className={styles.action}>
            {soldOut ? (
              <ButtonLink href={href} variant="secondary" size="sm" block>
                Batafsil
              </ButtonLink>
            ) : line && limits ? (
              <div className={styles.inCart}>
                <Stepper
                  size="sm"
                  decimal={line.measure !== "piece"}
                  label={`${product.name}: savatda, ${line.unit}`}
                  value={line.qty}
                  suffix={line.unit}
                  canIncrease={stepQty(line.qty, 1, limits) > line.qty}
                  onStep={(direction) => {
                    const next = stepQty(line.qty, direction, limits);
                    if (direction < 0 && next === line.qty) remove(line.key);
                    else setQty(line.key, next);
                  }}
                  onCommit={(draft) => {
                    const next = commitQty(draft, limits);
                    if (next != null) setQty(line.key, next);
                  }}
                />
                {pack && <span className={styles.pack}>{pack}</span>}
              </div>
            ) : (
              <Button
                size="sm"
                block
                variant={single ? "primary" : "secondary"}
                disabled={!ready}
                icon={single ? <Plus size={16} strokeWidth={2.5} aria-hidden /> : undefined}
                onClick={(event) => {
                  if (!single) {
                    setQuick(true);
                    return;
                  }
                  add(product, single, single.step);
                  cartFeedback(event.currentTarget);
                }}
              >
                {single ? (single.box && single.measure === "area" && single.stock >= single.box.qty ? "1 qutini savatga" : "Savatga") : inCart.length ? `Savatda: ${inCart.length} model` : "Modelni tanlash"}
              </Button>
            )}
          </div>
        </div>
      </div>
      {quick && price && <QuickBuy product={product} initial={price.option} onClose={closeQuick} />}
    </article>
  );
}
