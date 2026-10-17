import { productOptions, type BuyOption } from "../shop/options.ts";
import { tileCaption, tileFacts } from "../shop/tiles.ts";
import { fmtNumber } from "../storefront/currency.ts";
import type { OrderItemPayload, Product } from "../storefront/types";

import { clampQty } from "./quantity.ts";
import type { CartItem } from "./types";

/**
 * Pure cart reducers: each takes the current lines and returns the next ones,
 * or the same array when nothing changes. `useCart` persists the result.
 */

/** Stored stand-in for "no limit": JSON has no Infinity. */
export const UNLIMITED = 999_999;

const storable = (max: number) => (Number.isFinite(max) ? max : UNLIMITED);

export function lineKey(productId: number, optionKey: string): string {
  return `${productId}_${optionKey}`;
}

/** The product page of a line, opened on its model. */
export function lineHref(item: Pick<CartItem, "product_id" | "option_key">): string {
  return item.option_key === "base" ? `/product/${item.product_id}` : `/product/${item.product_id}?o=${item.option_key}`;
}

/** Price × amount, in so'm. */
export function lineTotal(it: Pick<CartItem, "price" | "qty">): number {
  return Math.round(it.price * it.qty);
}

/** Price × amount in the line's own currency (dollars for a dollar-priced tile). */
export function lineCurTotal(it: Pick<CartItem, "cur_price" | "qty">): number {
  return Math.round(it.cur_price * it.qty * 100) / 100;
}

/** The whole cart in so'm: what the dollar prices come to at the shop's rate, plus the so'm ones. */
export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, it) => sum + lineTotal(it), 0);
}

/** The cart in each currency it is priced in: `{ USD: 52.5, "": 300000 }`. */
export function cartByCurrency(cart: CartItem[]): Partial<Record<"USD" | "", number>> {
  const totals: Partial<Record<"USD" | "", number>> = {};
  for (const it of cart) totals[it.currency] = Math.round(((totals[it.currency] ?? 0) + lineCurTotal(it)) * 100) / 100;
  return totals;
}

/** Tiles in an amount: 10.08 m² of 60×60 is 28. Null when the tile's size is unknown. */
export function linePieces(it: Pick<CartItem, "qty" | "measure" | "piece_area">): number | null {
  if (it.measure === "piece") return Math.round(it.qty);
  if (it.measure === "area" && it.piece_area) return Math.round(it.qty / it.piece_area);
  return null;
}

/** "3 quti + 2 dona", or "14 dona" when the box is unknown; empty when nothing can be said. */
export function packText(it: Pick<CartItem, "qty" | "measure" | "piece_area" | "box_pieces">): string {
  const pieces = linePieces(it);
  if (pieces == null) return "";
  if (!it.box_pieces || it.box_pieces < 2) return it.measure === "area" ? `${fmtNumber(pieces)} dona` : "";
  const boxes = Math.floor(pieces / it.box_pieces);
  const rest = pieces - boxes * it.box_pieces;
  return [boxes > 0 && `${fmtNumber(boxes)} quti`, rest > 0 && `${fmtNumber(rest)} dona`].filter(Boolean).join(" + ");
}

/** kg, or null when the ERP gives no weight for this tile. */
export function lineWeight(it: Pick<CartItem, "qty" | "weight_per_unit">): number | null {
  return it.weight_per_unit ? it.qty * it.weight_per_unit : null;
}

/** The cart's weight from the lines that have one, and whether any line was left out. */
export function cartWeight(cart: CartItem[]): { kg: number; partial: boolean } {
  let kg = 0;
  let partial = false;
  for (const it of cart) {
    const weight = lineWeight(it);
    if (weight == null) partial = true;
    else kg += weight;
  }
  return { kg: Math.round(kg), partial };
}

/** The most of `option` a line can hold. Each model has its own stock. */
export function capFor(option: BuyOption): number {
  return option.inStock ? option.stock : 0;
}

function limitsOf(option: BuyOption, max: number) {
  return { min: option.min, grain: option.grain, step: option.step, max };
}

function lineFor(p: Product, option: BuyOption, qty: number, max: number): CartItem {
  const facts = tileFacts(p);
  return {
    key: lineKey(p.id, option.key),
    product_id: p.id,
    variant_id: option.variantId,
    option_key: option.key,
    name: p.name,
    option_label: option.label ? `${option.legend} ${option.label}` : "",
    caption: tileCaption(facts),
    sku: option.sku,
    image: option.image,
    qty: clampQty(qty, limitsOf(option, max)),
    max_qty: storable(max),
    min_qty: option.min,
    grain: option.grain,
    step: option.step,
    unit: option.unit,
    measure: option.measure,
    price: option.price,
    currency: option.currency,
    cur_price: option.curPrice,
    piece_area: option.measure === "area" ? facts.pieceArea : null,
    box_pieces: option.box?.pieces ?? null,
    box_qty: option.box?.qty ?? null,
    weight_per_unit: option.weightPerUnit,
  };
}

/** Adds `qty` of an option, never beyond what its stock has left. */
export function addLine(cart: CartItem[], p: Product, option: BuyOption, qty: number): CartItem[] {
  const max = capFor(option);
  if (max < option.min || !(qty > 0)) return cart;

  const key = lineKey(p.id, option.key);
  const existing = cart.find((x) => x.key === key);
  if (existing) {
    const next = clampQty(existing.qty + qty, limitsOf(option, max));
    if (next === existing.qty) return cart;
    return cart.map((x) => (x.key === key ? { ...x, qty: next, max_qty: storable(max) } : x));
  }
  return [...cart, lineFor(p, option, qty, max)];
}

/** Sets a line's amount, in whole tiles and capped at its stock; below the minimum removes it. */
export function setLineQty(cart: CartItem[], key: string, qty: number): CartItem[] {
  const item = cart.find((x) => x.key === key);
  if (!item) return cart;
  if (!(qty >= item.min_qty - 1e-9)) return cart.filter((x) => x.key !== key);
  const capped = clampQty(qty, { min: item.min_qty, grain: item.grain, max: item.max_qty });
  if (capped === item.qty) return cart;
  return cart.map((x) => (x.key === key ? { ...x, qty: capped } : x));
}

export function removeLine(cart: CartItem[], key: string): CartItem[] {
  return cart.some((x) => x.key === key) ? cart.filter((x) => x.key !== key) : cart;
}

/**
 * Re-checks saved lines against the current catalog: prices, names, photos
 * and box figures are refreshed; amounts are snapped to whole tiles and
 * capped to stock; lines whose product or model is gone or sold out are
 * dropped.
 */
export function revalidateCart(cart: CartItem[], products: Product[]): CartItem[] {
  if (!products.length) return cart;
  const byId = new Map(products.map((p) => [p.id, p]));

  const next: CartItem[] = [];
  for (const it of cart) {
    const p = byId.get(it.product_id);
    const option = p && productOptions(p).find((o) => o.key === it.option_key);
    if (!p || !option) continue;
    const max = capFor(option);
    if (max < option.min) continue;
    next.push(lineFor(p, option, it.qty, max));
  }

  return JSON.stringify(next) === JSON.stringify(cart) ? cart : next;
}

/**
 * Accepts only well-formed lines from a saved cart, which may come from an
 * older build; `revalidateCart` fills in the rest from the catalog, or drops
 * them if the product is gone.
 */
export function sanitizeStoredCart(saved: unknown): CartItem[] {
  if (!Array.isArray(saved)) return [];
  const text = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
  const positive = (value: unknown, fallback: number) => (Number(value) > 0 ? Number(value) : fallback);
  const maybe = (value: unknown) => (Number(value) > 0 ? Number(value) : null);
  return saved
    .filter((it) => it && typeof it.product_id === "number" && Number(it.qty) > 0 && typeof it.option_key === "string")
    .map(
      (it) =>
        ({
          key: lineKey(it.product_id, it.option_key),
          product_id: it.product_id,
          variant_id: Number(it.variant_id) > 0 ? Number(it.variant_id) : null,
          option_key: it.option_key,
          name: text(it.name),
          option_label: text(it.option_label),
          caption: text(it.caption),
          sku: text(it.sku),
          image: text(it.image),
          qty: Number(it.qty),
          max_qty: positive(it.max_qty, UNLIMITED),
          min_qty: positive(it.min_qty, 1),
          grain: positive(it.grain, 1),
          step: positive(it.step, 1),
          unit: text(it.unit, "dona"),
          measure: it.measure === "area" || it.measure === "piece" ? it.measure : "other",
          price: Number(it.price) || 0,
          currency: it.currency === "USD" ? "USD" : "",
          cur_price: Number(it.cur_price) || Number(it.price) || 0,
          piece_area: maybe(it.piece_area),
          box_pieces: maybe(it.box_pieces),
          box_qty: maybe(it.box_qty),
          weight_per_unit: maybe(it.weight_per_unit),
        }) satisfies CartItem,
    )
    .filter((it, index, all) => all.findIndex((x) => x.key === it.key) === index);
}

/**
 * What `POST /storefront/orders/` gets: the amount in the product's own unit
 * (m², with decimals, or dona) and no `unit_id`, since every product is sold
 * in its base unit. This is what the previous site sent.
 */
export function toOrderItems(cart: CartItem[]): OrderItemPayload[] {
  return cart.map((it) => ({
    product_id: it.product_id,
    ...(it.variant_id ? { variant_id: it.variant_id } : {}),
    qty: it.qty,
  }));
}

/**
 * Order lines that ask for more than the catalog has, as messages for the
 * customer. The ERP checks too; this catches it first with a clearer
 * message.
 */
export function stockProblems(items: OrderItemPayload[], products: Product[]): string[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const problems: string[] = [];
  for (const item of items) {
    const p = byId.get(item.product_id);
    if (!p) continue;
    const options = productOptions(p);
    const option = item.variant_id ? options.find((o) => o.variantId === item.variant_id) : options[0];
    const name = option?.label ? `${p.name} · ${option.legend} ${option.label}` : p.name;
    if (!option || !option.inStock) {
      problems.push(`${name}: hozir sotuvda yo‘q`);
      continue;
    }
    if (item.qty > option.stock + 1e-6) {
      problems.push(`${name}: omborda ${fmtNumber(option.stock)} ${option.unit} qoldi, siz ${fmtNumber(item.qty)} ${option.unit} so‘radingiz`);
    }
  }
  return problems;
}
