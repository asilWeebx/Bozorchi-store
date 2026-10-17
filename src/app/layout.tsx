import type { Metadata, Viewport } from "next";
import { Jost, Marcellus } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { ShopOverlays } from "@/components/layout/ShopOverlays";
import { ShopUiProvider } from "@/components/layout/ShopUi";
import { BRAND } from "@/config/store";
import { CartSync } from "@/lib/cart/CartSync";
import { getCustomerCode } from "@/lib/customer/session";
import { SITE_URL } from "@/lib/site";
import { SHARE_IMAGE } from "@/lib/storefront/artwork";
import { CatalogProvider } from "@/lib/storefront/CatalogProvider";
import { shopLinks } from "@/lib/storefront/nav";
import { getCatalogView, getStore } from "@/lib/storefront/store";

import "./globals.css";
import styles from "./layout.module.css";

/* Headings: a Roman capital like the logo's "KAFEL". Text: geometric like its "BARAKA". */
const display = Marcellus({
  variable: "--font-marcellus",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});
const sans = Jost({
  variable: "--font-jost",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

const DESCRIPTION =
  "Kafel va keramogranit: 30×60, 60×60, 60×120 va boshqa o‘lchamlar, glans, mat, polirovka. Narxi m² hisobida, qutidagi dona va m² ko‘rsatilgan. Yetkazib berish, naqd yoki karta orqali to‘lov.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name}: kafel va keramogranit onlayn do‘koni`, template: `%s · ${BRAND.name}` },
  description: DESCRIPTION,
  openGraph: { title: BRAND.name, description: DESCRIPTION, type: "website", locale: "uz_UZ", siteName: BRAND.name, images: [SHARE_IMAGE] },
  twitter: { card: "summary_large_image", title: BRAND.name, description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#151311",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Needed on every page (header, search, cart checks); `cache()` makes the
  // pages' own calls for the same data free.
  const customerCode = await getCustomerCode();
  const [store, catalog] = await Promise.all([getStore(), getCatalogView(customerCode)]);
  const links = shopLinks(catalog.categories, catalog.products);

  return (
    <html lang="uz" className={`${display.variable} ${sans.variable}`}>
      <body>
        <CatalogProvider
          value={{
            products: catalog.products,
            categories: catalog.categories,
            categoryImages: catalog.categoryImages,
            topIds: catalog.topProducts.map((p) => p.id),
            showImages: catalog.showImages,
            showStock: catalog.showStock,
          }}
        >
          <ShopUiProvider>
            <CartSync />
            <Header links={links} />
            <main className={styles.main}>{children}</main>
            <Footer organization={store.organization} links={links} />
            <MobileNav />
            <ShopOverlays />
          </ShopUiProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
