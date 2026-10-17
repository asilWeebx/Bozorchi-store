import { displayPrice, isOutOfStock, productOptions, variantName } from "../shop/options.ts";
import { foldApostrophes, tileFacts, type Finish } from "../shop/tiles.ts";

import type { ApiCategory, Category, CategoryImage, Product } from "./types";

/**
 * Synthetic top-level category for products the ERP never assigned one to.
 * Real category ids come from the ERP as positive integers, so this can't
 * collide with one.
 */
export const UNCATEGORIZED_ID = -1;
export const UNCATEGORIZED_NAME = "Boshqa mahsulotlar";

/** After `normalizeCategories`, a product has a category id exactly when it has a named category to sit in. */
export function isUncategorized(p: Product): boolean {
  return !p.category_id;
}

/** The name a category is matched by: capitals, one kind of apostrophe, single spaces. */
export function categoryKey(name: string): string {
  return foldApostrophes(name)
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/\s*([(),])\s*/g, "$1")
    .trim();
}

/** "60X120" → "60×120", in names written by hand in the ERP. */
const sizeMarks = (text: string) => text.replace(/(\d)\s*[xх×*]\s*(\d)/gi, "$1×$2");

/** Uzbek o‘ and g‘ with the proper mark: "Qo'qon" → "Qo‘qon". */
const okina = (text: string) => text.replace(/([oOgG])[ʻʼ’'`]/g, "$1‘");

function sentenceCase(text: string): string {
  const lower = text
    .toLowerCase()
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** A category name for people: "60X120 GLANS" → "60×120 glans", "Qo'qon kafel" → "Qo‘qon kafel", with the bracketed part as a note. */
export function categoryLabel(name: string): { label: string; note: string } {
  const match = name.trim().match(/^([^()]*)\(([^()]*)\)\s*$/);
  const main = match ? match[1] : name;
  const note = match ? match[2] : "";
  const tidy = (text: string) => okina(sizeMarks(sentenceCase(text)));
  return { label: tidy(main), note: note.trim() ? tidy(note) : "" };
}

interface NamedCategory {
  id: number;
  name: string;
}

/**
 * Rewrites each product's category fields into the two levels the storefront
 * shows: a top category (the maker: "Sirdaryo kafel", "Qo'qon kafel"), and
 * at most one subcategory under it (a size and surface: "60x60 GLANS").
 *
 * The API sends no category tree, only each product's category and that
 * category's parent, and nothing guarantees those rows are complete. So:
 *  - a name missing on one row is taken from any other row that has it;
 *  - a nameless category hands its products to its nearest named ancestor,
 *    or to no category when it has none;
 *  - a category whose parent is unknown becomes a top category;
 *  - anything deeper sits directly under its top category, labelled with the
 *    levels in between ("60x60 GLANS › 60X60 PALIROVKA") so same-named
 *    leaves differ. The grandparent is learnt from other products' rows.
 */
export function normalizeCategories(products: Product[]): Product[] {
  const names = new Map<number, string>();
  const parents = new Map<number, number>();
  const learnName = (id: number | null, name: string | null) => {
    const trimmed = name?.trim();
    if (id && trimmed && !names.has(id)) names.set(id, trimmed);
  };
  for (const p of products) {
    learnName(p.category_id, p.category_name);
    learnName(p.category_parent_id, p.category_parent_name);
    const { category_id: id, category_parent_id: parentId } = p;
    if (id && parentId && parentId !== id && !parents.has(id)) parents.set(id, parentId);
  }

  /** The named categories from `id` up to its root, nearest first. */
  const namedChain = (id: number): NamedCategory[] => {
    const chain: NamedCategory[] = [];
    const seen = new Set<number>();
    for (let current: number | undefined = id; current !== undefined;) {
      seen.add(current);
      const name = names.get(current);
      if (name) chain.push({ id: current, name });
      let up = parents.get(current);
      // A loop in the ERP data: cut it here, so every later walk agrees on
      // where the tree ends.
      if (up !== undefined && seen.has(up)) {
        parents.delete(current);
        up = undefined;
      }
      current = up;
    }
    return chain;
  };

  return products.map((p) => {
    const anchor = p.category_id || p.category_parent_id;
    const chain = anchor ? namedChain(anchor) : [];
    const top = chain.at(-1);
    if (!top) {
      return {
        ...p,
        category_id: null,
        category_name: null,
        category_parent_id: null,
        category_parent_name: null,
      };
    }
    if (chain.length === 1) {
      return {
        ...p,
        category_id: top.id,
        category_name: top.name,
        category_parent_id: null,
        category_parent_name: null,
      };
    }
    return {
      ...p,
      category_id: chain[0].id,
      category_name: chain
        .slice(0, -1)
        .reverse()
        .map((c) => c.name)
        .join(" › "),
      category_parent_id: top.id,
      category_parent_name: top.name,
    };
  });
}

function makeCategory(id: number, name: string, parentId: number | null): Category {
  const { label, note } = categoryLabel(name.split(" › ").at(-1) ?? name);
  return { id, name, label, note, parentId };
}

/**
 * The category list, rebuilt from the product rows (after
 * `normalizeCategories`): in the API's own order when it sends one, else in
 * the order products first mention them. Products without a category get a
 * catch-all at the end, but only next to real categories.
 */
export function buildCategories(products: Product[], apiOrder: ApiCategory[] = []): Category[] {
  const map = new Map<number, Category>();
  let hasUncategorized = false;
  for (const p of products) {
    if (p.category_parent_id && p.category_parent_name && !map.has(p.category_parent_id)) {
      map.set(p.category_parent_id, makeCategory(p.category_parent_id, p.category_parent_name, null));
    }
    if (p.category_id && p.category_name) {
      if (!map.has(p.category_id)) map.set(p.category_id, makeCategory(p.category_id, p.category_name, p.category_parent_id || null));
    } else if (isUncategorized(p)) {
      hasUncategorized = true;
    }
  }
  const fromApi = new Map(apiOrder.map((c, index) => [c.id, index]));
  const ordered = [...map.values()]
    .map((category, seen) => ({
      category,
      rank: fromApi.get(category.id) ?? apiOrder.length + seen,
    }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ category }) => category);
  if (hasUncategorized && ordered.length) {
    ordered.push({
      id: UNCATEGORIZED_ID,
      name: UNCATEGORIZED_NAME,
      label: UNCATEGORIZED_NAME,
      note: "",
      parentId: null,
    });
  }
  return ordered;
}

export function categoryImageMap(images: CategoryImage[] | undefined): Record<number, string> {
  return Object.fromEntries((images ?? []).map((c) => [c.id, c.image]));
}

/** Top-level categories, in the shop's order. */
export function topCategories(categories: Category[]): Category[] {
  return categories.filter((c) => c.parentId == null);
}

export function productsInCategory(products: Product[], categoryId: number): Product[] {
  if (categoryId === UNCATEGORIZED_ID) return products.filter(isUncategorized);
  return products.filter((p) => p.category_id === categoryId || p.category_parent_id === categoryId);
}

/** The product's maker as people read it ("Qo‘qon kafel"): its top category. */
export function productMaker(p: Product): string | null {
  const top = p.category_parent_name ?? p.category_name;
  return top ? categoryLabel(top.split(" › ")[0]).label : null;
}

/* ---------------------------------------------------- sizes and surfaces */

/** A size as a URL value: "60×120" ↔ "60x120". */
export const sizeParam = (label: string) => label.replace(/×/g, "x");
export const sizeFromParam = (value: string) => value.replace(/x/gi, "×");

export interface SizeFacet {
  /** "60×120". */
  label: string;
  /** In cm, for drawing the tile to scale. */
  a: number;
  b: number;
  count: number;
}

/** Every tile size in the catalog, smallest first, with how many products come in it. */
export function sizeFacets(products: Product[]): SizeFacet[] {
  const sizes = new Map<string, SizeFacet>();
  for (const p of products) {
    const size = tileFacts(p).size;
    if (!size) continue;
    const facet = sizes.get(size.label) ?? { label: size.label, a: size.a, b: size.b, count: 0 };
    facet.count++;
    sizes.set(size.label, facet);
  }
  return [...sizes.values()].sort((x, y) => x.a * x.b - y.a * y.b || x.a - y.a);
}

export function hasSize(p: Product, label: string): boolean {
  return tileFacts(p).size?.label === label;
}

export interface FinishFacet extends Finish {
  count: number;
}

/** The surfaces in the catalog (glans, mat, ...), most products first. */
export function finishFacets(products: Product[]): FinishFacet[] {
  const finishes = new Map<string, FinishFacet>();
  for (const p of products) {
    const finish = tileFacts(p).finish;
    if (!finish) continue;
    const facet = finishes.get(finish.id) ?? { ...finish, count: 0 };
    facet.count++;
    finishes.set(finish.id, facet);
  }
  return [...finishes.values()].sort((a, b) => b.count - a.count);
}

export function hasFinish(p: Product, id: string): boolean {
  return tileFacts(p).finish?.id === id;
}

/* --------------------------------------------------------------- search */

/** Rough price in so'm per unit, used to sort and to order "similar" products by closeness. */
export function approxPrice(p: Product): number {
  return displayPrice(productOptions(p))?.option.price ?? Infinity;
}

/** Whether the ERP sends an old price above the current one. */
export function isDiscounted(p: Product): boolean {
  return p.discount_percent > 0 || productOptions(p).some((o) => o.originalPrice != null);
}

/**
 * The same size and surface first, then the same size, then the same maker;
 * in stock and nearest in price first within each. Derived from the loaded
 * catalog, with no API call.
 */
export function similarProducts(p: Product | null, all: Product[], limit = 10): Product[] {
  if (!p) return [];
  const own = tileFacts(p);
  const maker = p.category_parent_id ?? p.category_id;
  const tiers: Product[][] = [[], [], []];
  for (const x of all) {
    if (x.id === p.id) continue;
    const facts = tileFacts(x);
    const sameSize = own.size && facts.size?.label === own.size.label;
    if (sameSize && own.finish && facts.finish?.id === own.finish.id) tiers[0].push(x);
    else if (sameSize) tiers[1].push(x);
    else if (maker && (x.category_parent_id ?? x.category_id) === maker) tiers[2].push(x);
  }
  const base = approxPrice(p);
  const byCloseness = (list: Product[]) =>
    [...list].sort((a, b) => Number(isOutOfStock(a)) - Number(isOutOfStock(b)) || Math.abs(approxPrice(a) - base) - Math.abs(approxPrice(b) - base));
  return tiers.flatMap(byCloseness).slice(0, limit);
}

/** "60x60", "60 x 60", "60*60" and "60х60" (Cyrillic) all read "60x60". */
const sizesAsTyped = (value: string) => value.replace(/(\d)\s*[xх×*]\s*(\d)/gi, "$1x$2");

/** Search text: name, article, categories, size, surface, models, description. */
function haystack(p: Product): string {
  const facts = tileFacts(p);
  return sizesAsTyped(
    foldApostrophes(
      [
        p.name,
        p.sku,
        p.category_name,
        p.category_parent_name,
        p.description,
        facts.size?.label,
        facts.size ? `${facts.size.b}x${facts.size.a}` : "",
        facts.finish?.id,
        ...(p.variants ?? []).flatMap((v) => [v.name, v.sku, variantName(v).value]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    ),
  );
}

/** Words customers type for the things the ERP names differently; "" drops a word every product matches. */
const SYNONYMS: [RegExp, string][] = [
  [/^(kafel|kafil|plitka|plitkа|keramogranit|keramika|кафел|плитк|керамогранит)/, ""],
  [/^(glyan|glanes|gloss|yaltiroq|глян)/, "glans"],
  [/^(matov|xira|матов)/, "mat"],
  [/^(polir|palir|полир)/, "polirovka"],
  [/^(shakar|сахар)/, "shakar"],
  [/^(zinapoya|stupen|ступен|лестниц)/, "zina"],
  [/^(razmer|размер|o'lcham|olcham)$/, ""],
];

function searchWords(query: string): string[] {
  return sizesAsTyped(foldApostrophes(query.toLowerCase()))
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => SYNONYMS.find(([pattern]) => pattern.test(word))?.[1] ?? word)
    .filter(Boolean);
}

export function matchesSearch(p: Product, query: string): boolean {
  const words = searchWords(query);
  if (!words.length) return true;
  const hay = haystack(p);
  return words.every((w) => hay.includes(w));
}

/** Character pairs, used to score how close two strings look. */
function bigrams(value: string): Set<string> {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9а-яёўқғҳ]+/gi, " ")
    .trim();
  const pairs = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i++) pairs.add(normalized.slice(i, i + 2));
  return pairs;
}

/**
 * When a search has no exact match: products sharing any word with the
 * query, most shared words first; failing that, the closest spellings, so a
 * typo ("8320" for "8230") still finds something.
 */
export function searchSuggestions(query: string, all: Product[], limit = 8): Product[] {
  const words = searchWords(query);
  if (!words.length) return [];

  const scored: [Product, number][] = [];
  for (const p of all) {
    const hay = haystack(p);
    const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    if (score > 0) scored.push([p, score]);
  }
  if (scored.length) {
    scored.sort((a, b) => b[1] - a[1] || Number(isOutOfStock(a[0])) - Number(isOutOfStock(b[0])));
    return scored.slice(0, limit).map((s) => s[0]);
  }

  const queryPairs = bigrams(query);
  if (!queryPairs.size) return [];
  return all
    .map((p) => {
      const productPairs = bigrams(haystack(p));
      let overlap = 0;
      queryPairs.forEach((pair) => {
        if (productPairs.has(pair)) overlap++;
      });
      return { p, score: overlap / queryPairs.size };
    })
    .filter(({ score }) => score >= 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

/* -------------------------------------------------------------- filters */

export type SortKey = "default" | "price-asc" | "price-desc" | "name";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Tavsiya etilgan" },
  { key: "price-asc", label: "Arzonroq" },
  { key: "price-desc", label: "Qimmatroq" },
  { key: "name", label: "Nomi bo‘yicha" },
];

export interface CatalogFilters {
  categoryId: number | null;
  /** A tile size label: "60×120". */
  size: string | null;
  /** A surface id: "glans". */
  finish: string | null;
  query: string;
  stockOnly: boolean;
  saleOnly: boolean;
  sort: SortKey;
}

export const NO_FILTERS: CatalogFilters = {
  categoryId: null,
  size: null,
  finish: null,
  query: "",
  stockOnly: false,
  saleOnly: false,
  sort: "default",
};

/** The catalog page's list. Sold-out products sink to the end. */
export function filterProducts(products: Product[], f: CatalogFilters): Product[] {
  let list = products;
  if (f.categoryId != null) list = productsInCategory(list, f.categoryId);
  if (f.size) list = list.filter((p) => hasSize(p, f.size!));
  if (f.finish) list = list.filter((p) => hasFinish(p, f.finish!));
  if (f.query.trim()) list = list.filter((p) => matchesSearch(p, f.query));
  if (f.stockOnly) list = list.filter((p) => !isOutOfStock(p));
  if (f.saleOnly) list = list.filter(isDiscounted);

  const sorted = [...list];
  if (f.sort === "price-asc") sorted.sort((a, b) => approxPrice(a) - approxPrice(b));
  if (f.sort === "price-desc") sorted.sort((a, b) => approxPrice(b) - approxPrice(a));
  if (f.sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "uz", { numeric: true }));
  return inStockFirst(sorted);
}

export interface CategoryShelf {
  category: Category;
  products: Product[];
}

/** One shelf per top-level category, in the shop's order; ones with nothing in stock are left out. */
export function categoryShelves(categories: Category[], products: Product[]): CategoryShelf[] {
  return topCategories(categories)
    .map((category) => ({
      category,
      products: inStockFirst(productsInCategory(products, category.id)),
    }))
    .filter((shelf) => shelf.products.some((p) => !isOutOfStock(p)));
}

/** Best-seller IDs matched against the catalog in rank order, sold-out ones skipped. */
export function rankTopProducts(ids: number[], products: Product[]): Product[] {
  if (!ids.length || !products.length) return [];
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is Product => Boolean(p))
    .filter((p) => !isOutOfStock(p));
}

/** Sold-out products never lead a list, whatever order they arrived in. */
export function inStockFirst(products: Product[]): Product[] {
  return [...products].sort((a, b) => Number(isOutOfStock(a)) - Number(isOutOfStock(b)));
}
