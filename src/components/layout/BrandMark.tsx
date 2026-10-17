import Image from "next/image";

import { BRAND } from "@/config/store";

import styles from "./BrandMark.module.css";

/** The shop's logo files, trimmed to their artwork (see public/brand/). Both are drawn for a dark background. */
const LOGOS = {
  /** The K emblem with "KAFEL BARAKA" and the slogan. */
  full: { src: "/brand/logo.webp", width: 1117, height: 360 },
  /** The K emblem alone, for tight spaces. */
  emblem: { src: "/brand/emblem.webp", width: 432, height: 360 },
} as const;

/** The Kafel Baraka logo; `height` sets its size in px (the width follows). Only on dark surfaces. */
export function Logo({
  variant = "full",
  height = 48,
  eager = false,
  className,
}: {
  variant?: keyof typeof LOGOS;
  height?: number;
  /** Above the fold: load at once instead of lazily. */
  eager?: boolean;
  className?: string;
}) {
  const logo = LOGOS[variant];
  return (
    <Image
      src={logo.src}
      alt={BRAND.name}
      width={Math.round((height * logo.width) / logo.height)}
      height={height}
      loading={eager ? "eager" : "lazy"}
      className={[styles.logo, className].filter(Boolean).join(" ")}
    />
  );
}
