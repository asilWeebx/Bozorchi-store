"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";

import styles from "./SafeImage.module.css";

/**
 * `next/image` throws during render on a src it cannot parse, so one bad
 * catalog row would take the page down. Only http(s) URLs and approved local
 * asset paths render.
 */
export function isRenderableImageUrl(src: string | null | undefined): src is string {
  if (!src?.trim()) return false;
  if (/^\/(assets|brand|banners)\/[a-z0-9/_-]+\.(png|webp|jpe?g)$/i.test(src)) return true;
  try {
    const { protocol } = new URL(src);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * An optimised image that degrades instead of breaking: when the optimizer
 * cannot fetch it, the browser loads it directly; when that fails too, the
 * `fallback` (or a plain placeholder) shows. Fills its (positioned) parent.
 */
export function SafeImage({
  src,
  alt,
  sizes = "100vw",
  eager = false,
  className,
  fallback,
  onFail,
}: {
  src: string | null | undefined;
  alt: string;
  sizes?: string;
  /** Above-the-fold images load at once instead of lazily. */
  eager?: boolean;
  className?: string;
  fallback?: ReactNode;
  onFail?: () => void;
}) {
  // Keyed by src so a new image starts over without an effect.
  const [failure, setFailure] = useState<{ src: string; level: number } | null>(null);
  const level = failure && failure.src === src ? failure.level : 0;

  if (!isRenderableImageUrl(src) || level >= 2) {
    return (
      fallback ?? (
        <span className={styles.fallback}>
          <ImageOff size={28} strokeWidth={1.5} aria-hidden />
          <span className="sr-only">Rasm mavjud emas</span>
        </span>
      )
    );
  }

  return (
    <Image
      key={level}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={[styles.image, className].filter(Boolean).join(" ")}
      loading={eager ? "eager" : "lazy"}
      unoptimized={level === 1}
      onError={() => {
        setFailure({ src, level: level + 1 });
        if (level >= 1) onFail?.();
      }}
    />
  );
}
