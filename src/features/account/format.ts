const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

/** `"2026-09-27T…"` → `"27 sentabr 2026"`. */
export function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const PAYMENT_METHODS: Record<string, string> = {
  cash: "Naqd",
  card: "Karta",
  transfer: "O'tkazma",
  credit: "Nasiya",
  installment: "Bo‘lib to‘lash",
  mixed: "Aralash",
  click: "Click",
  payme: "Payme",
  uzum: "Uzum",
  humo: "Humo",
  uzcard: "UzCard",
};

export function paymentLabel(method?: string): string {
  return PAYMENT_METHODS[method ?? ""] ?? (method || "—");
}

/** Order status label and tone, for the status chip. */
export const ORDER_STATUS: Record<string, { label: string; tone: "info" | "warning" | "success" | "muted" }> = {
  new: { label: "Yangi", tone: "info" },
  confirmed: { label: "Tasdiqlangan", tone: "warning" },
  sold: { label: "Yetkazilgan", tone: "success" },
  cancelled: { label: "Bekor qilingan", tone: "muted" },
};
