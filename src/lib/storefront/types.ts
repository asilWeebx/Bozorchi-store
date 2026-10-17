/**
 * Types for the dukonline.uz Storefront API, taken from live responses of
 * `https://api.dukonline.uz/api/storefront/*` for the Kafel Baraka tenant
 * (2026-10-17).
 *
 * The API has six endpoints and no per-product, category or pagination
 * endpoint, so the whole catalog arrives in one call and everything else is
 * derived from it.
 */

/** `tracked` products decrement stock; others (`infinite`) are always sellable. */
export type StockType = "tracked" | "untracked" | "infinite" | (string & {});

/** A banner as the API sends it: a bare URL or an object. */
export type RawStoreBanner =
  | string
  | {
      id?: number;
      image_url?: string;
      image?: string;
      url?: string;
      photo?: string;
      file?: string;
      title?: string;
      align?: string;
      [key: string]: unknown;
    };

export interface StoreBanner {
  image: string;
  title: string;
  align: "left" | "right";
}

export interface StoreInfo {
  /** "Kafel baraka". */
  organization: string;
  /** "KAFEL": the branch the stock comes from. */
  store: string;
  /** A symbol (`"$"`), a code (`"USD"`) or a word (`"so'm"`). */
  currency: string;
  banners: RawStoreBanner[];
}

/**
 * How a product without variants is sold: "Metr kvadrat" for tiles, "Dona"
 * for stair steps. Every product has exactly one unit today, the base unit
 * (`unit_id: null`, `multiplier: 1`).
 *
 * `price` is always in so'm. A tile priced in dollars in the ERP has
 * `currency: "USD"` and its dollar price in `cur_price`; `price` is then
 * that price at the ERP's rate (6.3 × 12 100 = 76 230 on 2026-10-17).
 * `currency: ""` means the row is priced in so'm and `cur_price` repeats it.
 */
export interface ProductUnit {
  /** Null for the product's own base unit, which orders then leave out. */
  unit_id: number | null;
  unit_name: string;
  multiplier: number;
  /** In so'm. */
  price: number;
  /** In so'm; null when not discounted. */
  original_price: number | null;
  /** "USD" or empty (so'm). */
  currency: string;
  /** In `currency`. */
  cur_price: number;
  cur_original_price: number | null;
  is_base?: boolean;
  uom_id?: number | null;
}

/** One value of a variant attribute. None are sent today; variants are told apart by name. */
export interface VariantOption {
  attribute_id: number;
  attribute: string;
  value_id: number;
  value: string;
}

/** An attribute the product's variants differ by, with its values in the ERP's order. */
export interface VariantAttribute {
  id: number;
  name: string;
  values: { id: number; value: string }[];
}

/**
 * One model of a tile series ("MADEL: A", "MADEL: B"). Prices as in
 * `ProductUnit`, per the product's unit. Products with variants send no
 * `units` at all.
 */
export interface ProductVariant {
  id: number;
  name: string;
  sku?: string;
  image?: string | null;
  price: number;
  original_price: number | null;
  currency: string;
  cur_price: number;
  cur_original_price: number | null;
  /** In the product's base unit; null when stock is not tracked. */
  stock: number | null;
  in_stock: boolean;
  options?: VariantOption[];
}

/**
 * Free-form attributes set in the ERP. Tiles (`product_type: "kafel"`) send
 * `{ razmer: "60X60", pochka_m2: "1.44", dona_per_pochka: "4",
 * pochka_weight_kg: "28" }`: the tile size in cm, and one box's area, number
 * of tiles and weight. Values arrive as strings.
 */
export type ProductAttributes = Record<string, string | number | null | undefined>;

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  category_id: number | null;
  category_name: string | null;
  category_parent_id: number | null;
  category_parent_name: string | null;
  /** The main photo. */
  image: string;
  /** The whole gallery, main photo first. */
  images?: string[];
  stock_type: StockType;
  /** In the base unit (m² for tiles), whole tiles × tile area in practice: 27.72 m² = 154 tiles of 30×60. */
  stock: number;
  in_stock: boolean;
  has_variants: boolean;
  variants: ProductVariant[];
  variant_attributes?: VariantAttribute[];
  units: ProductUnit[];
  discount_percent: number;
  /** ERP product class: "kafel" when the tile attributes are filled in, else empty. */
  product_type: string;
  attributes: ProductAttributes;
}

export interface CategoryImage {
  id: number;
  image: string;
}

/**
 * A category as the ERP lists it. Not sent today: once the API adds a
 * `categories` list to the catalog response, the site follows its order.
 */
export interface ApiCategory {
  id: number;
  name: string;
  parent_id?: number | null;
}

export interface CatalogResponse {
  store: string;
  results: Product[];
  show_stock: boolean;
  show_images: boolean;
  category_images: CategoryImage[];
  categories?: ApiCategory[];
}

export interface TopProductsResponse {
  product_ids: number[];
}

export interface Customer {
  customer_code: string;
  code?: string;
  name?: string;
  customer_name?: string;
  phone?: string;
  phone_number?: string;
  debt?: number;
  credit?: number;
  currency_debts?: Record<string, number>;
  currency_credits?: Record<string, number>;
  [key: string]: unknown;
}

export interface CustomerSaleItem {
  name?: string;
  product_name?: string;
  qty?: number;
  quantity?: number;
  unit?: string;
  unit_name?: string;
  price?: number;
}

export interface CustomerSale {
  receipt_number?: string;
  created_at?: string;
  total?: number;
  paid?: number;
  debt?: number;
  debt_currency?: string;
  debt_currency_amount?: number;
  debt_rate?: number;
  payment_breakdown?: { method?: string; amount?: number }[];
  payment_method?: string;
  items?: CustomerSaleItem[];
}

export interface CustomerOrder {
  order_no?: string;
  created_at?: string;
  total?: number;
  status?: string;
}

export interface CustomerPayment {
  amount?: number;
  currency?: string;
  created_at?: string;
  note?: string;
}

export interface CustomerAccountResponse {
  customer: Customer;
  sales: CustomerSale[];
  online_orders: CustomerOrder[];
  payments: CustomerPayment[];
}

export interface OrderItemPayload {
  product_id: number;
  variant_id?: number;
  /** Only for a non-base unit; the base unit is the default. */
  unit_id?: number;
  /** In the chosen unit (or the base unit when `unit_id` is left out). */
  qty: number;
}

export type DeliveryType = "courier" | "pickup";

export interface OrderPayload {
  customer_name: string;
  phone: string;
  delivery_type: DeliveryType;
  payment_method: string;
  address?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  customer_code?: string;
  /** The customer's comment for the shop. */
  note?: string;
  items: OrderItemPayload[];
}

export interface OrderResponse {
  order_no: string;
  status?: string;
  total?: number;
  [key: string]: unknown;
}

/** A category derived from product rows; `parentId` null = top level. */
export interface Category {
  id: number;
  /** As the ERP spells it ("60x120 GLANS"); also the key for ordering. */
  name: string;
  /** For people: "60×120 glans". */
  label: string;
  /** The ERP name's bracketed part, for people. */
  note: string;
  parentId: number | null;
}
