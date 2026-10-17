import { fmtNumber, priceText, som, usdRate } from "../storefront/currency.ts";

import { cartByCurrency, cartTotal, cartWeight } from "./lines.ts";
import type { CartItem } from "./types";

export interface CartSummary {
  /** "$52.50 + 300 000 so'm", or "1 200 000 so'm" when everything is in so'm. */
  total: string;
  /** For carts with dollar prices: "≈ 935 250 so'm, 1 $ = 12 100 so'm". */
  inSom: string | null;
  /** "≈ 560 kg", with "dan ortiq" when some lines have no weight; null when none have one. */
  weight: string | null;
}

/**
 * The cart's total as the previous site showed it, in each currency the
 * tiles are priced in, plus what it all comes to in so'm at the shop's rate.
 */
export function summarizeCart(items: CartItem[]): CartSummary {
  const byCurrency = cartByCurrency(items);
  const usd = byCurrency.USD ?? 0;
  const local = byCurrency[""] ?? 0;
  const parts = [usd > 0 && priceText(usd, "USD"), (local > 0 || usd === 0) && som(local)].filter(Boolean);
  const rate = usd > 0 ? usdRate(items.map((it) => ({ price: it.price, curPrice: it.cur_price, currency: it.currency }))) : null;
  const { kg, partial } = cartWeight(items);
  return {
    total: parts.join(" + "),
    inSom: usd > 0 ? `≈ ${som(cartTotal(items))}${rate ? `, 1 $ = ${fmtNumber(rate)} so‘m` : ""}` : null,
    weight: kg > 0 ? `≈ ${fmtNumber(kg)} kg${partial ? " dan ortiq" : ""}` : null,
  };
}
