"use client";

import { House, LayoutGrid, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCart } from "@/lib/cart/useCart";

import styles from "./MobileNav.module.css";
import { useShopUi } from "./ShopUi";

const ITEMS = [
  { id: "home", href: "/", label: "Asosiy", Icon: House },
  { id: "catalog", href: null, label: "Katalog", Icon: LayoutGrid },
  { id: "cart", href: null, label: "Savat", Icon: ShoppingBag },
  { id: "account", href: "/account", label: "Kabinet", Icon: User },
] as const;

/** Bottom tab bar on phones; the header carries these actions on larger screens. */
export function MobileNav() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const { open, overlay, close } = useShopUi();

  return (
    <nav className={styles.nav} aria-label="Asosiy navigatsiya">
      {ITEMS.map(({ id, href, label, Icon }) => {
        const active = overlay ? overlay === id : id === "home" ? pathname === "/" : pathname.startsWith(`/${id}`);
        const content = (
          <>
            <span className={styles.icon} data-cart-target={id === "cart" ? "" : undefined}>
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              {id === "cart" && ready && count > 0 && <span className={styles.badge}>{count > 99 ? "99+" : count}</span>}
            </span>
            {label}
          </>
        );
        return href ? (
          <Link
            key={id}
            href={href}
            className={styles.item}
            aria-current={active ? "page" : undefined}
            onClick={() => {
              close();
              if (href === "/" && pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {content}
          </Link>
        ) : (
          <button key={id} type="button" className={styles.item} aria-pressed={active} aria-haspopup="dialog" onClick={() => (id === "cart" || id === "catalog") && open(id)}>
            {content}
          </button>
        );
      })}
    </nav>
  );
}
