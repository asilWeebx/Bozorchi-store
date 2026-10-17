/**
 * Shop details the storefront API does not provide. Everything left empty is
 * simply not shown: fill these in when the shop is ready to publish them.
 */

/** The brand on the logo. The ERP's own names are "Kafel baraka" (organization) and "KAFEL" (branch). */
export const BRAND = {
  name: "Kafel Baraka",
  /** The line under the logo. */
  tagline: "Sifat · Tanlov · Baraka",
};

export const STORE_CONTACT = {
  /** Shown in the footer and checkout, e.g. ["+998 90 123 45 67"]. */
  phones: [] as string[],
  /** Where pickup orders are collected, e.g. "Toshkent sh., ... ko'chasi 12". */
  address: "",
  /** A landmark for the address. */
  landmark: "",
  /** e.g. "Har kuni 9:00–19:00". */
  hours: "",
  /** Where couriers deliver, e.g. "Toshkent shahri va viloyati". */
  deliveryArea: "",
  /** Full links, e.g. "https://t.me/kafelbaraka". */
  telegram: "",
  instagram: "",
};

/**
 * Who answers privacy questions, as the shop's published policy (the old
 * privacy.html, also used for the mobile app) lists them.
 */
export const PRIVACY_CONTACT = {
  phone: "+998 97 802 20 08",
  email: "asilweb9999@icloud.com",
};

/** Where the map opens at checkout before the customer moves it: Tashkent, as on the previous site. */
export const MAP_CENTER = { lat: 41.311081, lng: 69.240562 };

/** "+998 90 123 45 67" → "tel:+998901234567". */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
