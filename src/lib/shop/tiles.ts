import type { Product } from "../storefront/types";

/**
 * What a tile is, read from the ERP: its size, surface, box and weight.
 *
 * Tiles with `product_type: "kafel"` carry the facts as attributes
 * (`razmer`, `pochka_m2`, `dona_per_pochka`, `pochka_weight_kg`). The rest
 * (a third of the catalog on 2026-10-17) have none, but their category names
 * say the size and surface ("60X120 GLANS"), and that is enough to know the
 * area of one tile.
 */

/** Uzbek apostrophes vary (o‘, o', oʻ); compared as one. */
export const foldApostrophes = (value: string) => value.replace(/[ʻʼ’‘`]/g, "'");

/** "60X60", "60х60" (Cyrillic), "60*60", "24.5X6.5" → [60, 60]. */
const SIZE = /(\d{1,3}(?:[.,]\d)?)\s*[xх×*]\s*(\d{1,3}(?:[.,]\d)?)/i;

export interface TileSize {
  /** In cm, as the ERP writes them: 60 × 120, 120 × 35. */
  a: number;
  b: number;
  /** "60×120". */
  label: string;
  /** One tile, in m². */
  area: number;
}

export interface Finish {
  id: "glans" | "mat" | "shakar" | "polirovka";
  /** "Glans". */
  label: string;
}

/** One box (pochka) as the ERP describes it. */
export interface TileBox {
  /** m² in one box: 1.44. */
  area: number;
  /** Tiles in one box: 4. */
  pieces: number;
  /** kg; null when the ERP leaves it out. */
  weight: number | null;
}

export interface TileFacts {
  size: TileSize | null;
  finish: Finish | null;
  /** From the ERP's attributes only; never guessed. */
  box: TileBox | null;
  /**
   * The area of one tile in m², when it can be trusted: the box's area over
   * its tiles when that agrees with the size, else the size alone. Orders in
   * m² are whole tiles of this.
   */
  pieceArea: number | null;
}

const number = (value: unknown): number | null => {
  const parsed = Number(String(value ?? "").replace(",", ".").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/** Rounds away float noise: 0.18 × 3 is 0.54, not 0.5400000000000001. */
export const tidy = (value: number, places = 4) => Math.round(value * 10 ** places) / 10 ** places;

/** "60" and "24.5" as people write them. */
const cm = (value: number) => String(tidy(value, 1));

export function parseSize(text: string | null | undefined): TileSize | null {
  const match = String(text ?? "").match(SIZE);
  if (!match) return null;
  const a = number(match[1]);
  const b = number(match[2]);
  if (!a || !b) return null;
  return { a, b, label: `${cm(a)}×${cm(b)}`, area: tidy((a * b) / 10_000, 6) };
}

/* Spelled as the ERP does (GLANS, MAT, SHAKAR, PALIROVKA) and as customers type them. */
const FINISHES: [RegExp, Finish][] = [
  [/p[ao]lirov|polir|полир/i, { id: "polirovka", label: "Polirovka" }],
  [/shakar|сахар/i, { id: "shakar", label: "Shakar" }],
  [/glans|glyan|glanes|gloss|глян/i, { id: "glans", label: "Glans" }],
  [/(^|[^a-z])mat(oviy)?([^a-z]|$)|матов/i, { id: "mat", label: "Mat" }],
];

/** The surface named in the text, most specific first: "60x60 GLANS › 60X60 PALIROVKA" is polished. */
export function parseFinish(text: string | null | undefined): Finish | null {
  const value = String(text ?? "");
  return FINISHES.find(([pattern]) => pattern.test(value))?.[1] ?? null;
}

/** Where the ERP may have written a size or surface: the attribute, the categories (nearest first), the description. */
function sources(p: Product): string[] {
  const category = (p.category_name ?? "").split(" › ").reverse();
  return [String(p.attributes?.razmer ?? ""), ...category, p.category_parent_name ?? "", p.description ?? ""].filter(Boolean);
}

/** The box from the attributes, when all of area and tiles are there. */
function boxOf(p: Product): TileBox | null {
  const area = number(p.attributes?.pochka_m2);
  const pieces = number(p.attributes?.dona_per_pochka);
  if (!area || !pieces || !Number.isInteger(pieces)) return null;
  return { area, pieces, weight: number(p.attributes?.pochka_weight_kg) };
}

/**
 * One tile's area. The box's own figures win when they agree with the size
 * (within 3%); when they don't (one 30×60 row says 4 tiles in 1.44 m², which
 * would be 60×60), the size is believed, since the box count is the likelier
 * typo.
 */
function pieceAreaOf(size: TileSize | null, box: TileBox | null): number | null {
  // Unrounded: 0.6 m² over 38 clinker tiles must come back to exactly 0.6 m² for 38.
  const fromBox = box ? box.area / box.pieces : null;
  if (fromBox && size && Math.abs(fromBox - size.area) / size.area <= 0.03) return fromBox;
  return size?.area ?? null;
}

const cache = new WeakMap<Product, TileFacts>();

export function tileFacts(p: Product): TileFacts {
  const known = cache.get(p);
  if (known) return known;
  const texts = sources(p);
  let size: TileSize | null = null;
  for (const text of texts) if ((size = parseSize(text))) break;
  let finish: Finish | null = null;
  for (const text of texts) if ((finish = parseFinish(text))) break;
  const box = boxOf(p);
  const facts = { size, finish, box, pieceArea: pieceAreaOf(size, box) };
  cache.set(p, facts);
  return facts;
}

/** Whether the box's own figures add up: its area is a whole number of tiles. */
export function boxIsConsistent(facts: TileFacts): boolean {
  const { box, pieceArea } = facts;
  return Boolean(box && pieceArea && Math.abs(box.area / pieceArea - box.pieces) < 0.05);
}

/** "60×120 · Glans", for card captions and titles; empty when neither is known. */
export function tileCaption(facts: TileFacts): string {
  return [facts.size?.label, facts.finish?.label].filter(Boolean).join(" · ");
}
