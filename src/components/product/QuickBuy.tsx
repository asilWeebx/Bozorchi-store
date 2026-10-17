"use client";

import Link from "next/link";
import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { productOptions, type BuyOption } from "@/lib/shop/options";
import type { Product } from "@/lib/storefront/types";

import { BuyBox } from "./BuyBox";
import { OptionPicker } from "./OptionPicker";
import styles from "./QuickBuy.module.css";

/** Choosing a model of a series from a card, without leaving the list. */
export function QuickBuy({ product, initial, onClose }: { product: Product; initial: BuyOption; onClose: () => void }) {
  const options = productOptions(product);
  const [key, setKey] = useState(initial.key);
  const option = options.find((o) => o.key === key) ?? options[0];
  return (
    <Dialog title={product.name} onClose={onClose}>
      <div className={styles.quick}>
        <OptionPicker options={options} selected={option} onSelect={(o) => setKey(o.key)} />
        <BuyBox key={key} product={product} option={option} />
        <Link className={styles.details} href={option.key === "base" ? `/product/${product.id}` : `/product/${product.id}?o=${option.key}`} onClick={onClose}>
          Batafsil ma’lumot →
        </Link>
      </div>
    </Dialog>
  );
}
