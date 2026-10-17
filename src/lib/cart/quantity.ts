import { toGrain } from "../shop/options.ts";

/**
 * Amounts are in the option's unit (m² or dona) and always a whole number of
 * `grain` (one tile's m², or 1). `step` is what + and − move by: a box.
 */
export interface Limits {
  min?: number;
  max?: number;
  grain?: number;
  step?: number;
}

/** The most that can be ordered, in whole grains. */
function cap(max: number, grain: number): number {
  return Number.isFinite(max) ? toGrain(max, grain, "down") : Infinity;
}

/**
 * Whole tiles between `min` and `max`. Typed amounts round up, so a
 * customer who needs 10 m² of 60×60 gets 28 tiles (10.08 m²), not 27.
 */
export function clampQty(value: number, { max = Infinity, grain = 1, min = grain }: Limits = {}): number {
  return Math.min(Math.max(min, toGrain(value, grain, "up")), cap(max, grain));
}

/**
 * Turns what was typed into a quantity field into the quantity to apply, or
 * `null` to discard the edit. Empty and non-numeric input is discarded, so a
 * customer can clear "1.44" and type "10" without the line vanishing in
 * between. "2,5" and "2.5" both work.
 */
export function commitQty(draft: string, limits: Limits = {}): number | null {
  const raw = draft.trim().replace(/\s+/g, "").replace(",", ".");
  if (raw === "") return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return clampQty(parsed, limits);
}

/**
 * The next value of a +/− button: to the next whole box up or down (2.5
 * boxes goes to 3 or 2), never below `min` nor above `max`; at the stock
 * limit + stops at whatever is left. When − leaves the value unchanged, a
 * cart line takes that as "remove".
 */
export function stepQty(qty: number, direction: 1 | -1, { max = Infinity, grain = 1, min = grain, step = grain }: Limits = {}): number {
  const boxes = qty / step;
  const target = (direction > 0 ? Math.floor(boxes + 1e-6) + 1 : Math.ceil(boxes - 1e-6) - 1) * step;
  const next = toGrain(target, grain, "nearest");
  const top = cap(max, grain);
  if (next > top) return Math.max(qty, top);
  if (next < min) return Math.min(qty, min);
  return next;
}
