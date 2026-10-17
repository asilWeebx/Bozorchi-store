"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";

import { TileArt } from "@/components/product/TileArt";
import { SafeImage } from "@/components/ui/SafeImage";
import { Stepper } from "@/components/ui/Stepper";
import { lineCurTotal, lineHref, lineTotal, lineWeight, packText, UNLIMITED } from "@/lib/cart/lines";
import { commitQty, stepQty } from "@/lib/cart/quantity";
import type { CartItem } from "@/lib/cart/types";
import { parseSize } from "@/lib/shop/tiles";
import { fmtNumber, priceText, som } from "@/lib/storefront/currency";

import styles from "./CartLine.module.css";

/**
 * One cart line, in m² (whole tiles) or pieces; + and − move by a box, and −
 * at the smallest amount removes it, like the bin button.
 */
export function CartLine({ item, onQty, onRemove }: { item: CartItem; onQty: (qty: number) => void; onRemove: () => void }) {
  const href = lineHref(item);
  const limits = { min: item.min_qty, grain: item.grain, step: item.step, max: item.max_qty };
  const pack = packText(item);
  const weight = lineWeight(item);
  const usd = item.currency === "USD";

  return (
    <li className={styles.line}>
      <div className={styles.body}>
        <Link href={href} className={styles.media} tabIndex={-1} aria-hidden>
          <SafeImage src={item.image} alt="" sizes="80px" className={styles.photo} fallback={<TileArt size={parseSize(item.caption)} label={false} />} />
        </Link>

        <div className={styles.info}>
          <Link href={href} className={styles.name}>
            {item.name}
          </Link>
          {(item.caption || item.option_label) && (
            <p className={styles.meta}>
              {item.caption && <span className={styles.option}>{item.caption}</span>}
              {item.option_label && <span className={styles.option}>{item.option_label}</span>}
            </p>
          )}
          <p className={styles.unit}>
            1 {item.unit} · {priceText(item.cur_price, item.currency)}
            {usd && <> (≈ {som(item.price)})</>}
          </p>
        </div>

        <div className={styles.controls}>
          <Stepper
            size="sm"
            decimal={item.measure !== "piece"}
            label={`${item.name}: miqdori, ${item.unit}`}
            value={item.qty}
            suffix={item.unit}
            canIncrease={stepQty(item.qty, 1, limits) > item.qty}
            onStep={(direction) => {
              const next = stepQty(item.qty, direction, limits);
              if (direction < 0 && next === item.qty) onRemove();
              else onQty(next);
            }}
            onCommit={(draft) => {
              const next = commitQty(draft, limits);
              if (next != null) onQty(next);
            }}
          />
          <span className={styles.totals}>
            <strong className={styles.total}>{usd ? priceText(lineCurTotal(item), "USD") : som(lineTotal(item))}</strong>
            {(pack || weight) && <span className={styles.pack}>{[pack, weight ? `≈ ${fmtNumber(Math.round(weight))} kg` : ""].filter(Boolean).join(" · ")}</span>}
          </span>
          <button type="button" className={styles.remove} onClick={onRemove} aria-label={`${item.name}: savatdan olib tashlash`}>
            <Trash2 size={18} aria-hidden />
          </button>
        </div>
        {item.qty >= item.max_qty - 1e-6 && item.max_qty < UNLIMITED && (
          <p className={styles.cap}>
            Omborda shuncha bor: {fmtNumber(item.max_qty)} {item.unit}
          </p>
        )}
      </div>
    </li>
  );
}
