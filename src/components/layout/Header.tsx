import Link from "next/link";
import { Suspense } from "react";

import { Container } from "@/components/ui/Container";
import { BRAND } from "@/config/store";
import type { ShopLink } from "@/lib/storefront/nav";

import { Logo } from "./BrandMark";
import { CartButton } from "./CartButton";
import { CategoryNav } from "./CategoryNav";
import styles from "./Header.module.css";
import { AccountLink, CatalogButton } from "./NavActions";
import { SearchBox } from "./SearchBox";

/**
 * Sticky header on the logo's own dark: brand, catalog, search, account and
 * cart. Wide screens get the catalog's entrances (makers, tile sizes) as a
 * light second row; phones keep a compact search field beside the emblem.
 */
export function Header({ links }: { links: ShopLink[] }) {
  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label={`${BRAND.name}, bosh sahifa`}>
          <Logo height={46} eager className={styles.logo} />
          <Logo variant="emblem" height={40} eager className={styles.emblem} />
        </Link>

        <CatalogButton className={styles.catalog} />

        <div className={styles.search}>
          <SearchBox />
        </div>

        <div className={styles.mobileSearch}>
          <SearchBox compact />
        </div>

        <nav className={styles.actions} aria-label="Foydalanuvchi">
          <AccountLink className={`${styles.action} ${styles.desktopOnly}`} labelClassName={styles.actionLabel} />
          <CartButton className={styles.action} labelClassName={styles.actionLabel} />
        </nav>
      </Container>

      <Suspense>
        <CategoryNav links={links} />
      </Suspense>
    </header>
  );
}
