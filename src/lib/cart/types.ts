import type { Measure } from "../shop/options";

/**
 * One cart line: an amount of one tile (or one model of a series).
 *
 *   key: `${product_id}_${option key}`   e.g. `1066_base`, `1106_v2304`
 */
export interface CartItem {
  key: string;
  product_id: number;
  variant_id: number | null;
  /** Links back to the model on the product page (`v2304`, or `base`). */
  option_key: string;

  name: string;
  /** "Model A"; empty when the product has one option. */
  option_label: string;
  /** "60×120 · Glans". */
  caption: string;
  sku: string;
  image: string;

  /** In `unit`: m² (a whole number of tiles) or dona. */
  qty: number;
  /** The cap on `qty` from stock; `UNLIMITED` when stock is not tracked. */
  max_qty: number;
  min_qty: number;
  /** Every amount is a multiple of this: one tile's m², or 1. */
  grain: number;
  /** What + and − move by: one box. */
  step: number;
  /** "m²" or "dona". */
  unit: string;
  measure: Measure;

  /** In so'm, per unit. */
  price: number;
  /** "USD" when the shop prices this tile in dollars, else "". */
  currency: "USD" | "";
  /** In `currency`, per unit. */
  cur_price: number;

  /** m² of one tile, for counting tiles in an m² line; null when unknown. */
  piece_area: number | null;
  /** Tiles per box; null when the box is unknown. */
  box_pieces: number | null;
  /** One box in `unit`. */
  box_qty: number | null;
  /** kg per unit; null when unknown. */
  weight_per_unit: number | null;
}
