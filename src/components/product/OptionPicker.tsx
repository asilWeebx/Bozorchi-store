"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import type { BuyOption } from "@/lib/shop/options";
import { priceText } from "@/lib/storefront/currency";

import styles from "./OptionPicker.module.css";

/**
 * The models of a series ("Model: A, B, C") as chips, with the model's own
 * photo when it has one and its price when models differ. A sold-out model
 * stays clickable but faded, so its page can still be seen.
 */
export function OptionPicker({ options, selected, onSelect }: { options: BuyOption[]; selected: BuyOption; onSelect: (option: BuyOption) => void }) {
  const variants = options.filter((o) => o.variantId != null);
  if (variants.length < 2) return null;
  const legend = selected.legend || "Model";
  const pricesDiffer = new Set(variants.map((o) => o.price)).size > 1;

  return (
    <div className={styles.rows}>
      <fieldset className={styles.picker}>
        <legend className={styles.legend}>
          {legend}
          {selected.label && <strong className={styles.current}>: {selected.label}</strong>}
        </legend>
        <div className={styles.chips} role="radiogroup" aria-label={legend}>
          {variants.map((option) => (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={option.key === selected.key}
              aria-label={option.inStock ? option.label : `${option.label}, tugagan`}
              className={`${styles.chip} ${option.photo ? styles.photoChip : ""} ${option.inStock ? "" : styles.out}`}
              onClick={() => onSelect(option)}
            >
              {option.photo && (
                <span className={styles.photo}>
                  <SafeImage src={option.photo} alt="" sizes="56px" fallback={<span />} />
                </span>
              )}
              <span className={styles.text}>
                <span className={styles.label}>{option.label}</span>
                {pricesDiffer && <span className={styles.price}>{priceText(option.curPrice, option.currency)}</span>}
                {!option.inStock && <span className={styles.sub}>Tugagan</span>}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
