/**
 * Money formatting. The shop prices some tiles in dollars and the rest in
 * so'm; a price is shown in the currency the ERP sets it in, as the previous
 * site did, with the so'm amount at the shop's rate beside dollar prices.
 * Every total adds up the ERP's `price`, which is always in so'm.
 */

/** Space thousands separators, the convention across UZ retail. */
function withThousands(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** `som(50000) -> "50 000 so'm"`. */
export function som(amount: number | null | undefined): string {
  return withThousands(Math.round(Number(amount) || 0).toString()) + " so'm";
}

/** `usd(0.65) -> "$0.65"`, `usd(12) -> "$12"`. */
export function usd(amount: number | null | undefined): string {
  const value = Math.round((Number(amount) || 0) * 100) / 100;
  const [whole, fraction] = Number.isInteger(value) ? [value.toString(), ""] : value.toFixed(2).split(".");
  return "$" + withThousands(whole) + (fraction ? `.${fraction}` : "");
}

/**
 * An amount in the currency the ERP names, for the customer account, where a
 * debt can be kept in dollars: `money(12, "USD") -> "$12"`, `money(5000, "")
 * -> "5 000 so'm"`.
 */
export function money(amount: number | null | undefined, currency?: string | null): string {
  const code = String(currency ?? "").trim().toUpperCase();
  if (!code || code === "UZS" || code === "SO'M" || code === "SUM") return som(amount);
  if (code === "USD" || code === "$") return usd(amount);
  return `${code} ${fmtNumber(Number(amount) || 0)}`;
}

/** A whole number shows as "2", a fraction as "2.5" (at most 2 decimals). */
export function fmtNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return (
    withThousands(String(Math.trunc(rounded))) +
    (Number.isInteger(rounded) ? "" : "." + rounded.toFixed(2).split(".")[1].replace(/0+$/, ""))
  );
}

/** A price in the currency the ERP sets it in: "$6.30" or "52 000 so'm". */
export function priceText(amount: number | null | undefined, currency: "USD" | ""): string {
  return currency === "USD" ? usd(amount) : som(amount);
}

/**
 * The shop's dollar rate as the ERP applies it (so'm `price` over dollar
 * `cur_price`), the most common one when rows differ; null without dollar rows.
 */
export function usdRate(rows: { price: number; curPrice: number; currency: string }[]): number | null {
  const counts = new Map<number, number>();
  for (const row of rows) {
    if (row.currency !== "USD" || !(row.curPrice > 0) || !(row.price > 0)) continue;
    const rate = Math.round(row.price / row.curPrice);
    counts.set(rate, (counts.get(rate) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
