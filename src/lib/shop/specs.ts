import { fmtNumber } from "../storefront/currency.ts";
import type { Product } from "../storefront/types";

import type { BuyOption } from "./options.ts";
import { boxIsConsistent, tileFacts } from "./tiles.ts";

export interface SpecRow {
  label: string;
  value: string;
}

/** The ERP's tile attributes, named for people; anything else is listed under its own name. */
const ATTRIBUTE_LABELS: Record<string, string> = {
  razmer: "O‘lcham",
  pochka_m2: "Bir qutida, m²",
  dona_per_pochka: "Bir qutida, dona",
  pochka_weight_kg: "Bir quti og‘irligi, kg",
};

const humanize = (key: string) => {
  const text = key.replace(/[_-]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * The product page's facts: section, size and surface, what a box
 * holds and weighs, the model and article, then any other ERP attributes.
 * Figures that don't add up (a box whose area isn't its tiles) are shown as
 * the ERP has them, without derived numbers.
 */
export function productSpecs(p: Product, option: BuyOption, maker: string | null, section: string | null): SpecRow[] {
  const facts = tileFacts(p);
  const { box, size, finish, pieceArea } = facts;
  const known = new Set(["razmer", "pochka_m2", "dona_per_pochka", "pochka_weight_kg"]);
  const consistent = boxIsConsistent(facts);
  const rows: (SpecRow | null)[] = [
    // The ERP's top categories mix regions, brands and countries ("Sirdaryo kafel", "Krea", "Polsha", "XIT"), so they are a section, not a maker.
    maker ? { label: "Bo‘lim", value: [maker, section !== maker ? section : null].filter(Boolean).join(" › ") } : null,
    size ? { label: "O‘lcham", value: `${size.label} sm` } : null,
    finish ? { label: "Sirti", value: finish.label } : null,
    option.label ? { label: option.legend, value: option.label } : null,
    pieceArea && option.measure === "area" ? { label: "Bir dona maydoni", value: `${String(Math.round(pieceArea * 10_000) / 10_000)} m²` } : null,
    box ? { label: ATTRIBUTE_LABELS.dona_per_pochka, value: `${fmtNumber(box.pieces)} dona` } : null,
    box ? { label: ATTRIBUTE_LABELS.pochka_m2, value: `${fmtNumber(box.area)} m²` } : null,
    box?.weight ? { label: "Bir quti og‘irligi", value: `${fmtNumber(box.weight)} kg` } : null,
    box?.weight && consistent && option.measure === "area" ? { label: "1 m² og‘irligi", value: `≈ ${fmtNumber(box.weight / box.area)} kg` } : null,
    option.sku ? { label: "Artikul", value: option.sku } : null,
    ...Object.entries(p.attributes ?? {})
      .filter(([key, value]) => !known.has(key) && value != null && String(value).trim())
      .map(([key, value]) => ({ label: ATTRIBUTE_LABELS[key] ?? humanize(key), value: String(value) })),
  ];
  return rows.filter((row): row is SpecRow => row != null);
}
