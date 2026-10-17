"use client";

import { ShoppingBag } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { summarizeCart } from "@/lib/cart/totals";
import { useCart } from "@/lib/cart/useCart";

import { CartLine } from "./CartLine";
import styles from "./CartView.module.css";

export function CartView() {
  const { items, ready, setQty, remove, clear } = useCart();

  if (!ready) return <div className={styles.skeleton} aria-busy="true" />;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={32} aria-hidden />}
        title="Savat hozircha bo‘sh"
        text="Katalogdan kafelni tanlang, kerakli m² ni yozing va savatga qo‘shing."
        action={
          <div className={styles.emptyActions}>
            <ButtonLink href="/catalog">Katalogga o‘tish</ButtonLink>
          </div>
        }
      />
    );
  }

  const summary = summarizeCart(items);

  return (
    <div className={styles.layout}>
      <div>
        <div className={styles.listHead}>
          <h1 className={styles.title}>Savat</h1>
          <Button variant="ghost" size="sm" onClick={clear}>
            Tozalash
          </Button>
        </div>
        <ul className={styles.list}>
          {items.map((item) => (
            <CartLine key={item.key} item={item} onQty={(qty) => setQty(item.key, qty)} onRemove={() => remove(item.key)} />
          ))}
        </ul>
      </div>

      <aside className={styles.summary}>
        <h2 className={styles.summaryTitle}>Buyurtma</h2>
        <dl className={styles.rows}>
          <div className={styles.row}>
            <dt>Mahsulotlar</dt>
            <dd>{items.length} xil</dd>
          </div>
          {summary.weight && (
            <div className={styles.row}>
              <dt>Og‘irligi</dt>
              <dd>{summary.weight}</dd>
            </div>
          )}
          <div className={`${styles.row} ${styles.totalRow}`}>
            <dt>Jami</dt>
            <dd>{summary.total}</dd>
          </div>
          {summary.inSom && <p className={styles.inSom}>{summary.inSom}</p>}
        </dl>
        <p className={styles.note}>Yetkazib berish narxi va vaqtini do‘kon buyurtmadan so‘ng aytadi.</p>
        <ButtonLink href="/checkout" size="lg" block>
          Rasmiylashtirish
        </ButtonLink>
      </aside>
    </div>
  );
}
