import { Flame } from "lucide-react";

import { SetupNotice } from "@/components/layout/SetupNotice";
import { Container } from "@/components/ui/Container";
import { HeroCarousel, type HeroSlide } from "@/features/home/HeroCarousel";
import { HowToOrder } from "@/features/home/HowToOrder";
import { PackGuide } from "@/features/home/PackGuide";
import { Perks } from "@/features/home/Perks";
import { ProductShelf } from "@/features/home/ProductShelf";
import { SizeStrip } from "@/features/home/SizeStrip";
import { getCustomerCode } from "@/lib/customer/session";
import { categoryShelves, inStockFirst } from "@/lib/storefront/catalog";
import { getCatalogView, getStore } from "@/lib/storefront/store";

/** Best sellers get their own shelf once there are enough to fill a row. */
const TOP_SHELF_MIN = 4;

/**
 * The shop's own banner photos and their headlines from the previous site,
 * shown while the ERP has no banners of its own.
 */
const SHOP_SLIDES: HeroSlide[] = [
  {
    image: "/banners/modern-interior.webp",
    eyebrow: "Kafel Baraka",
    title: "Uyingizga mos nafis kafellar",
    text: "Katta format va zamonaviy kolleksiyalar",
    href: "/catalog",
    focus: "62% 50%",
  },
  {
    image: "/banners/tile-collection.webp",
    eyebrow: "Sifat · Tanlov · Baraka",
    title: "Har uslub uchun yangi tanlovlar",
    text: "Rang, faktura va o‘lchamlarni bir joyda solishtiring",
    href: "/catalog",
    focus: "70% 50%",
  },
  {
    image: "/banners/delivery.webp",
    eyebrow: "Yetkazib berish",
    title: "Tanlang. Buyurtma bering. Yetkazib beramiz.",
    text: "Ta’mirlash uchun kerakli mahsulotlar oson va qulay",
    href: "/catalog",
    align: "right",
    focus: "30% 50%",
  },
];

export default async function HomePage() {
  const customerCode = await getCustomerCode();
  const [store, catalog] = await Promise.all([getStore(), getCatalogView(customerCode)]);

  if (!catalog.configured) {
    return (
      <Container>
        <SetupNotice reason={catalog.reason ?? store.reason} error={catalog.error ?? store.error} />
      </Container>
    );
  }

  const products = inStockFirst(catalog.products);
  const shelves = categoryShelves(catalog.categories, products);
  const banners: HeroSlide[] = store.banners.map((b) => ({ image: b.image, alt: b.title }));
  const top = catalog.topProducts.length >= TOP_SHELF_MIN;

  return (
    <>
      <Container>
        <HeroCarousel slides={banners.length ? banners : SHOP_SLIDES} />
      </Container>
      <Perks />

      {top && <ProductShelf title="Ko‘p sotilganlar" icon={<Flame size={20} aria-hidden />} products={catalog.topProducts} highlight showCategory eagerCount={2} />}

      <SizeStrip products={products} />

      {/* One shelf per maker, in the ERP's order; the first stands out when there are no best sellers. */}
      {shelves.map((s, index) => (
        <ProductShelf
          key={s.category.id}
          title={s.category.label}
          note={s.category.note}
          href={`/catalog?category=${s.category.id}`}
          count={s.products.length}
          products={s.products}
          eagerCount={!top && index === 0 ? 2 : 0}
        />
      ))}

      <PackGuide products={products} />
      <HowToOrder />
    </>
  );
}
