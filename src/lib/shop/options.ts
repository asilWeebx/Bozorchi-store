import type { Product, ProductUnit, ProductVariant } from "../storefront/types";

import { boxIsConsistent, tidy, tileFacts } from "./tiles.ts";

/**
 * What a customer can buy on a product page, flattened so the card, the buy
 * box and the cart never branch: one option per variant ("Model A"), or the
 * product itself in its unit when it has none.
 *
 * Tiles are sold by the m² but come in whole tiles, so an amount in m² is
 * always a whole number of tiles (`grain`); the +/− buttons move by whole
 * boxes (`step`). Pieces (stair steps) are whole numbers.
 */

/** How a unit is counted: tiles by area, steps by the piece. */
export type Measure = "area" | "piece" | "other";

export function unitMeasure(name: string | null | undefined): Measure {
  const key = String(name ?? "").toLowerCase().trim();
  if (!key || /^(dona|sht|ta$|шт|штук)/.test(key)) return "piece";
  if (/kvadrat|kv\.?\s?m|m2|m²|кв/.test(key)) return "area";
  return "other";
}

/** Short label after a number or price: "m²", "dona". */
export function unitLabel(name: string | null | undefined): string {
  const measure = unitMeasure(name);
  if (measure === "area") return "m²";
  if (measure === "piece") return "dona";
  return String(name ?? "").trim().toLowerCase();
}

/** The currency a price is set in: dollars, or so'm for anything else the ERP sends ("", "UZS"). */
export function pricingCurrency(code: string | null | undefined): "USD" | "" {
  const value = String(code ?? "").trim().toUpperCase();
  return value === "USD" || value === "$" || value === "US$" ? "USD" : "";
}

/** One box as an option sells it: how much of the option's unit it is. */
export interface OptionBox {
  /** In the option's unit: 1.44 (m²) or 2 (dona). */
  qty: number;
  pieces: number;
  /** m². */
  area: number;
  /** kg; null when unknown. */
  weight: number | null;
}

export interface BuyOption {
  /** Stable within a product: `v<variant id>` or `base`. */
  key: string;
  variantId: number | null;
  /** The variant's own value ("A"); empty for a product without variants. */
  label: string;
  /** What the variants differ by: "Model". */
  legend: string;
  sku: string;
  /** The photo to show: the variant's own, else the product's. */
  image: string;
  /** The variant's own photo only; null when it has none. */
  photo: string | null;
  /** In so'm, per unit. What every total adds up. */
  price: number;
  /** In so'm; null when not discounted. */
  originalPrice: number | null;
  /** The currency the ERP prices this in: "USD", or "" for so'm. */
  currency: "USD" | "";
  /** In `currency`, per unit. Equals `price` for so'm rows. */
  curPrice: number;
  curOriginalPrice: number | null;
  /** "m²" or "dona". */
  unit: string;
  measure: Measure;
  /** The smallest amount, and what every amount is a multiple of: one tile's m², or 1. */
  grain: number;
  /** One press of + or −: a box when it is known, else one tile (or 1). */
  step: number;
  min: number;
  /** Set only when the ERP's box figures add up. */
  box: OptionBox | null;
  /** kg per unit; null when the ERP gives no weight. */
  weightPerUnit: number | null;
  /** In the unit, in whole tiles; `Infinity` when not tracked. */
  stock: number;
  inStock: boolean;
}

export function hasVariants(p: Product): boolean {
  return Boolean(p.has_variants && p.variants?.length);
}

/** The product's own unit: the one marked base, else the one with no multiplier, else the first. */
export function baseUnit(p: Product): ProductUnit | undefined {
  return p.units?.find((u) => u.is_base) ?? p.units?.find((u) => (u.multiplier || 1) === 1) ?? p.units?.[0];
}

/** The old price, only when it is really above the current one. */
function original(price: number, old: number | null | undefined): number | null {
  return old != null && old > price ? old : null;
}

export const capitalise = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

/** The ERP's spelling of the series' attribute, fixed: "MADEL" → "Model". */
function legendOf(name: string): string {
  const clean = name.trim().toLowerCase();
  if (/^m[ao]del/.test(clean)) return "Model";
  return capitalise(clean) || "Turi";
}

/** "MADEL: A" → { legend: "Model", value: "A" }; a name without a colon is the value itself. */
export function variantName(v: Pick<ProductVariant, "name" | "options">): { legend: string; value: string } {
  const options = (v.options ?? []).filter((o) => o.value?.trim());
  if (options.length) {
    return { legend: legendOf(options.map((o) => o.attribute).join(" · ")), value: options.map((o) => o.value.trim()).join(" · ") };
  }
  const match = v.name.match(/^\s*([^:]{1,24}):\s*(.+)$/);
  if (match) return { legend: legendOf(match[1]), value: match[2].trim() };
  return { legend: "Turi", value: v.name.trim() };
}

/**
 * Rounds to whole multiples of `grain`; `mode` says which way. Within a
 * thousandth of a tile counts as whole, so float noise never adds a tile.
 */
export function toGrain(value: number, grain: number, mode: "up" | "down" | "nearest" = "nearest"): number {
  const units = value / grain;
  const whole = mode === "up" ? Math.ceil(units - 1e-3) : mode === "down" ? Math.floor(units + 1e-3) : Math.round(units);
  return tidy(whole * grain, 3);
}

interface Selling {
  measure: Measure;
  unit: string;
  grain: number;
  step: number;
  box: OptionBox | null;
  weightPerUnit: number | null;
}

/** How a product's unit is counted, stepped and weighed, from its tile facts. */
function selling(p: Product, unitName: string): Selling {
  const measure = unitMeasure(unitName);
  const unit = unitLabel(unitName);
  const facts = tileFacts(p);
  const raw = facts.box;

  if (measure === "area") {
    const grain = facts.pieceArea ?? 0.01;
    const box = raw && boxIsConsistent(facts) ? { qty: raw.area, pieces: raw.pieces, area: raw.area, weight: raw.weight } : null;
    return {
      measure,
      unit,
      grain,
      step: box?.qty ?? facts.pieceArea ?? 1,
      box,
      weightPerUnit: raw?.weight ? raw.weight / raw.area : null,
    };
  }
  if (measure === "piece") {
    const box = raw && raw.pieces > 1 ? { qty: raw.pieces, pieces: raw.pieces, area: raw.area, weight: raw.weight } : null;
    return { measure, unit, grain: 1, step: 1, box, weightPerUnit: raw?.weight ? raw.weight / raw.pieces : null };
  }
  return { measure, unit, grain: 0.01, step: 1, box: null, weightPerUnit: null };
}

function stockOf(tracked: boolean, stock: number | null | undefined, grain: number): number {
  if (!tracked) return Infinity;
  return Math.max(0, toGrain(stock ?? 0, grain, "down"));
}

const optionsCache = new WeakMap<Product, BuyOption[]>();

export function productOptions(p: Product): BuyOption[] {
  const cached = optionsCache.get(p);
  if (cached) return cached;
  const tracked = p.stock_type === "tracked";
  const unit = baseUnit(p);
  // Products with variants send no units; their unit is the shop's usual one.
  const sell = selling(p, unit?.unit_name ?? (tileFacts(p).size ? "Metr kvadrat" : "Dona"));

  let options: BuyOption[];
  if (hasVariants(p)) {
    options = p.variants.map((v) => {
      const { legend, value } = variantName(v);
      const stock = stockOf(tracked, v.stock, sell.grain);
      const currency = pricingCurrency(v.currency);
      return {
        key: `v${v.id}`,
        variantId: v.id,
        label: value,
        legend,
        sku: v.sku || p.sku,
        image: v.image || p.image,
        photo: v.image || null,
        price: v.price,
        originalPrice: original(v.price, v.original_price),
        currency,
        curPrice: currency ? v.cur_price : v.price,
        curOriginalPrice: currency ? original(v.cur_price, v.cur_original_price) : original(v.price, v.original_price),
        ...sell,
        min: sell.grain,
        stock,
        inStock: (!tracked || v.in_stock) && stock >= sell.grain,
      };
    });
  } else if (unit) {
    const stock = stockOf(tracked, p.stock, sell.grain);
    const currency = pricingCurrency(unit.currency);
    options = [
      {
        key: "base",
        variantId: null,
        label: "",
        legend: "",
        sku: p.sku,
        image: p.image,
        photo: null,
        price: unit.price,
        originalPrice: original(unit.price, unit.original_price),
        currency,
        curPrice: currency ? unit.cur_price : unit.price,
        curOriginalPrice: currency ? original(unit.cur_price, unit.cur_original_price) : original(unit.price, unit.original_price),
        ...sell,
        min: sell.grain,
        stock,
        inStock: (!tracked || p.in_stock) && stock >= sell.grain,
      },
    ];
  } else {
    options = [];
  }
  optionsCache.set(p, options);
  return options;
}

/** The requested option when it exists, else the first one in stock. */
export function defaultOption(options: BuyOption[], key?: string | null): BuyOption | undefined {
  return options.find((o) => key != null && o.key === key) ?? options.find((o) => o.inStock) ?? options[0];
}

export function isOutOfStock(p: Product): boolean {
  return !productOptions(p).some((o) => o.inStock);
}

/**
 * The price a card shows: the cheapest option in stock (by so'm, so dollar
 * and so'm rows compare), flagged when models cost different amounts.
 */
export function displayPrice(options: BuyOption[]): { option: BuyOption; varies: boolean } | null {
  if (!options.length) return null;
  const available = options.filter((o) => o.inStock);
  const pool = available.length ? available : options;
  return {
    option: pool.reduce((min, next) => (next.price < min.price ? next : min)),
    varies: new Set(pool.map((o) => o.price)).size > 1,
  };
}

/** The product's photos, main first, then any variant photos not in it. */
export function productGallery(p: Product): string[] {
  const photos = [...(p.images?.length ? p.images : [p.image])];
  for (const v of p.variants ?? []) if (v.image) photos.push(v.image);
  return [...new Set(photos.filter(Boolean))];
}
