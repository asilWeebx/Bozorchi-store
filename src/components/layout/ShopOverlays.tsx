"use client";

import { ChevronRight, Layers, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { CartLine } from "@/features/cart/CartLine";
import { summarizeCart } from "@/lib/cart/totals";
import { useCart } from "@/lib/cart/useCart";
import { useCatalog } from "@/lib/storefront/CatalogProvider";
import { shopLinks } from "@/lib/storefront/nav";

import { SearchBox } from "./SearchBox";
import { TileGlyph } from "./TileGlyph";
import styles from "./ShopOverlays.module.css";
import { useShopUi } from "./ShopUi";

/** The whole catalog in one sheet: the makers with their sections, then the tile sizes. */
function CatalogDrawer() {
  const { close } = useShopUi();
  const { categories, products } = useCatalog();
  const links = shopLinks(categories, products);
  const makers = links.filter((l) => l.kind === "category");
  const sizes = links.filter((l) => l.kind === "size");

  return (
    <Dialog title="Katalog" onClose={close} side>
      <Link href="/catalog" className={styles.all} onClick={close}>
        Barcha mahsulotlar
        <span className={styles.count}>{products.length}</span>
        <ChevronRight size={18} aria-hidden />
      </Link>

      {makers.length > 0 && (
        <section>
          <h3 className={styles.heading}>Bo‘limlar</h3>
          <ul className={styles.categories}>
            {makers.map((link) => {
              const children = categories.filter((c) => `c${c.parentId}` === link.key);
              return (
                <li key={link.key}>
                  <Link href={link.href} className={styles.category} onClick={close}>
                    <span className={styles.categoryIcon}>
                      <Layers size={20} aria-hidden />
                    </span>
                    <span className={styles.categoryText}>
                      {link.label}
                      {children.length > 0 && <small>{children.map((c) => c.label).join(", ")}</small>}
                    </span>
                    <span className={styles.count}>{link.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {sizes.length > 0 && (
        <section>
          <h3 className={styles.heading}>O‘lchamlar</h3>
          <ul className={styles.brands}>
            {sizes.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className={styles.brand} onClick={close}>
                  {link.shape && <TileGlyph a={link.shape.a} b={link.shape.b} />}
                  {link.label}
                  <span>{link.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Dialog>
  );
}

/** The cart over whatever page is open. */
function CartSheet() {
  const { close } = useShopUi();
  const { items, ready, setQty, remove } = useCart();
  const summary = summarizeCart(items);
  return (
    <Dialog
      title={`Savat${ready && items.length ? ` · ${items.length}` : ""}`}
      onClose={close}
      side
      footer={
        items.length > 0 && (
          <>
            <p className={styles.total}>
              <span>
                Jami
                {(summary.weight || summary.inSom) && <small>{[summary.weight, summary.inSom].filter(Boolean).join(" · ")}</small>}
              </span>
              <strong>{summary.total}</strong>
            </p>
            <div className={styles.actions}>
              <ButtonLink href="/cart" variant="secondary" onClick={close}>
                Savat
              </ButtonLink>
              <ButtonLink href="/checkout" onClick={close}>
                Rasmiylashtirish
              </ButtonLink>
            </div>
          </>
        )
      }
    >
      {!ready ? (
        <p>Yuklanmoqda...</p>
      ) : items.length ? (
        <ul
          className={styles.cartLines}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) close();
          }}
        >
          {items.map((item) => (
            <CartLine key={item.key} item={item} onQty={(qty) => setQty(item.key, qty)} onRemove={() => remove(item.key)} />
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <ShoppingBag size={34} aria-hidden />
          </span>
          <p className={styles.emptyTitle}>Savat hozircha bo‘sh</p>
          <p>Kafelni tanlang, kerakli m² ni yozing va savatga qo‘shing.</p>
          <Button onClick={close}>Xaridni davom ettirish</Button>
        </div>
      )}
    </Dialog>
  );
}

export function ShopOverlays() {
  const { overlay, close } = useShopUi();
  if (overlay === "catalog") return <CatalogDrawer />;
  if (overlay === "cart") return <CartSheet />;
  if (overlay === "search")
    return (
      <Dialog title="Qidiruv" onClose={close}>
        <SearchBox expanded onNavigate={close} />
      </Dialog>
    );
  return null;
}
