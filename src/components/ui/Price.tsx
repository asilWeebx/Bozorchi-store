import { fmtNumber, priceText, som } from "@/lib/storefront/currency";

import styles from "./Price.module.css";

/**
 * "52 000 so'm / m²", or "$6.30 / m²" with "≈ 76 230 so'm" for a tile the
 * shop prices in dollars; the old price struck through when discounted; and
 * optionally what one box costs ("1 quti, 1.44 m²: 74 880 so'm").
 */
export function Price({
  amount,
  currency = "",
  inSom,
  original,
  size = "md",
  from = false,
  per,
  box,
}: {
  /** In `currency`. */
  amount: number;
  currency?: "USD" | "";
  /** The same price in so'm, shown beside a dollar price. */
  inSom?: number;
  /** In `currency`. */
  original?: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  /** A starting price: "52 000 so'm dan". */
  from?: boolean;
  /** What the amount buys: "m²". */
  per?: string;
  /** One box: its amount in `per` units, priced from `amount`. */
  box?: { qty: number; unit: string } | null;
}) {
  const discounted = original != null && original > amount;
  const percent = discounted && original > 0 ? Math.round((1 - amount / original) * 100) : 0;
  const showSom = currency === "USD" && inSom != null && inSom > 0;
  return (
    <span className={`${styles.price} ${styles[size]}`}>
      <span className={styles.amount}>{priceText(amount, currency)}</span>
      {(per || from) && (
        <span className={styles.per}>
          {per && `/ ${per}`}
          {from && " dan"}
        </span>
      )}
      {discounted && <s className={styles.original}>{priceText(original, currency)}</s>}
      {percent > 0 && percent < 100 && <span className={styles.discount}>−{percent}%</span>}
      {showSom && <span className={styles.extra}>≈ {som(inSom)}{per ? ` / ${per}` : ""}</span>}
      {box && box.qty > 0 && (
        <span className={styles.extra}>
          1 quti, {fmtNumber(box.qty)} {box.unit}: <strong>{priceText(currency === "USD" ? Math.round(amount * box.qty * 100) / 100 : amount * box.qty, currency)}</strong>
        </span>
      )}
    </span>
  );
}
