"use client";

import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Container } from "@/components/ui/Container";
import type { ShopLink } from "@/lib/storefront/nav";

import styles from "./CategoryNav.module.css";
import { TileGlyph } from "./TileGlyph";

/**
 * The second header row on wide screens: everything, then the makers and the
 * tile sizes, scrolling sideways when they don't fit.
 */
export function CategoryNav({ links }: { links: ShopLink[] }) {
  const pathname = usePathname();
  const params = useSearchParams().toString();
  const here = pathname === "/catalog" ? params : null;
  // Compared as parsed queries, so encoding differences don't matter.
  const isHere = (href: string) => here != null && new URLSearchParams(href.split("?")[1] ?? "").toString() === here;

  if (!links.length) return null;

  return (
    <nav className={styles.nav} aria-label="Katalog bo‘limlari">
      <Container className={styles.inner}>
        <ul className={styles.list}>
          <li>
            <Link href="/catalog" className={styles.link} aria-current={isHere("/catalog") ? "page" : undefined}>
              <LayoutGrid size={16} aria-hidden />
              Barcha mahsulotlar
            </Link>
          </li>
          {links.map((link, index) => (
            <li key={link.key} className={index > 0 && links[index - 1].kind !== link.kind ? styles.group : undefined}>
              <Link href={link.href} className={styles.link} aria-current={isHere(link.href) ? "page" : undefined} title={link.note || undefined}>
                {link.shape && <TileGlyph a={link.shape.a} b={link.shape.b} size={16} />}
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
