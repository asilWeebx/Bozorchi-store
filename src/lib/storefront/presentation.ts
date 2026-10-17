import type { RawStoreBanner, StoreBanner } from "./types";

/** ERP banners arrive as bare URLs or objects with the image under one of several keys. */
export function normalizeBanners(raw: RawStoreBanner[], resolve: (url: string) => string): StoreBanner[] {
  return raw.flatMap((banner) => {
    if (typeof banner === "string") return banner.trim() ? [{ image: resolve(banner), title: "", align: "left" as const }] : [];
    const known = [banner.image_url, banner.image, banner.url, banner.photo, banner.file].find((v) => typeof v === "string" && v.trim());
    const fallback = Object.values(banner).find((v) => typeof v === "string" && /\.(avif|gif|jpe?g|png|webp)(\?|$)/i.test(v));
    const image = known || fallback;
    return typeof image === "string"
      ? [{ image: resolve(image), title: banner.title || "", align: banner.align === "right" ? ("right" as const) : ("left" as const) }]
      : [];
  });
}

export function hasCurrencyBalance(balances?: Record<string, number>): boolean {
  return Object.values(balances ?? {}).some((value) => Number(value) > 0);
}
