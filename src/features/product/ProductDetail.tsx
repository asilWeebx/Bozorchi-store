"use client";

import { Banknote, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BuyBox } from "@/components/product/BuyBox";
import { OptionPicker } from "@/components/product/OptionPicker";
import { TileArt } from "@/components/product/TileArt";
import { defaultOption, productGallery, productOptions, type BuyOption } from "@/lib/shop/options";
import { productSpecs } from "@/lib/shop/specs";
import { tileFacts } from "@/lib/shop/tiles";
import type { Product } from "@/lib/storefront/types";

import { Gallery } from "./Gallery";
import styles from "./ProductDetail.module.css";
import { SpecTable } from "./SpecTable";

interface CategoryLink {
  label: string;
  href: string;
}

/**
 * The product page body. The chosen model of a series is kept in the URL
 * (`?o=v2304`), so a shared link opens on it.
 */
export function ProductDetail({
  product,
  initialOption,
  maker,
  section,
}: {
  product: Product;
  initialOption: string | null;
  /** The top category ("Qo‘qon kafel") and its catalog link. */
  maker: CategoryLink | null;
  /** The product's own category under it ("60×120 glans"), when it has one. */
  section: CategoryLink | null;
}) {
  const facts = tileFacts(product);
  const options = productOptions(product);
  const [optionKey, setOptionKey] = useState(() => defaultOption(options, initialOption)?.key ?? "base");
  const option = options.find((o) => o.key === optionKey) ?? options[0];

  const gallery = productGallery(product);
  const [photo, setPhoto] = useState(option?.image || product.image);

  const selectOption = (next: BuyOption) => {
    setOptionKey(next.key);
    if (next.image) setPhoto(next.image);
    window.history.replaceState(null, "", next.key === "base" ? window.location.pathname : `?o=${next.key}`);
  };

  return (
    <div className={styles.detail}>
      <div className={styles.media}>
        <Gallery
          images={gallery}
          active={photo}
          onSelect={setPhoto}
          alt={[product.name, facts.size?.label].filter(Boolean).join(", ")}
          art={<TileArt size={facts.size} glossy={facts.finish?.id === "glans" || facts.finish?.id === "polirovka"} />}
        />
      </div>

      <div className={styles.info}>
        <div className={styles.titleBlock}>
          <ul className={styles.tags}>
            {maker && (
              <li>
                <Link href={maker.href} className={`${styles.tag} ${styles.tagMuted}`}>
                  {maker.label}
                </Link>
              </li>
            )}
            {facts.size && <li className={`${styles.tag} ${styles.tagSize}`}>{facts.size.label} sm</li>}
            {facts.finish && <li className={styles.tag}>{facts.finish.label}</li>}
          </ul>
          <h1 className={styles.title}>{product.name}</h1>
          {option?.sku && <p className={styles.sku}>Artikul: {option.sku}</p>}
        </div>

        {option && options.length > 1 && <OptionPicker options={options} selected={option} onSelect={selectOption} />}

        {option ? (
          // Keyed by option, so the amount starts fresh for each model.
          <BuyBox key={option.key} product={product} option={option} />
        ) : (
          <p className={styles.unavailable}>Bu mahsulot hozircha onlayn sotilmaydi.</p>
        )}

        <ul className={styles.terms}>
          <li>
            <Truck size={18} aria-hidden />
            <span>Kuryer orqali yetkazib beramiz yoki do‘kondan o‘zingiz olib ketasiz. Narxi va vaqtini do‘kon telefonda kelishadi.</span>
          </li>
          <li>
            <Banknote size={18} aria-hidden />
            <span>To‘lov naqd yoki karta orqali, buyurtmani qabul qilganda.</span>
          </li>
        </ul>
      </div>

      <section className={styles.specs}>
        <h2 className={styles.subheading}>Xususiyatlari</h2>
        {option && <SpecTable rows={productSpecs(product, option, maker?.label ?? null, section?.label ?? null)} />}
      </section>

      {product.description?.trim() && (
        <section className={styles.about}>
          <h2 className={styles.subheading}>Tavsif</h2>
          <p className={styles.description}>{product.description}</p>
        </section>
      )}
    </div>
  );
}
