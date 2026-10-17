"use client";

import { ShoppingBag } from "lucide-react";

import { useCart } from "@/lib/cart/useCart";

import styles from "./CartButton.module.css";
import { useShopUi } from "./ShopUi";

export function CartButton({ className, labelClassName }: { className?: string; labelClassName?: string }) {
  const { count, ready } = useCart();
  const { open } = useShopUi();
  return (
    <button type="button" onClick={() => open("cart")} className={className} aria-label={`Savat, ${ready ? count : 0} ta mahsulot`} aria-haspopup="dialog">
      <span className={styles.icon} data-cart-target>
        <ShoppingBag size={22} strokeWidth={1.75} aria-hidden />
        {ready && count > 0 && <span className={styles.badge}>{count > 99 ? "99+" : count}</span>}
      </span>
      <span className={labelClassName}>Savat</span>
    </button>
  );
}
