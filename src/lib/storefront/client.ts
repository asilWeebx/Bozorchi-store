import "server-only";

import { after } from "next/server";

import type {
  CatalogResponse,
  Customer,
  CustomerAccountResponse,
  OrderPayload,
  OrderResponse,
  StoreInfo,
  TopProductsResponse,
} from "./types";
import { hedge } from "./hedge";
import { kvStore } from "./shared-cache";
import { createSwrCache } from "./swr-cache";

/**
 * Every dukonline storefront talks to the same host. The tenant is chosen
 * only by the `X-Storefront-Key` header, so only the key changes per store.
 */
export const API_URL =
  process.env.DUKONLINE_API_URL?.replace(/\/$/, "") ??
  "https://api.dukonline.uz/api";

const STOREFRONT_KEY = process.env.DUKONLINE_STOREFRONT_KEY ?? "";

/**
 * api.dukonline.uz sits behind a filter that answers a bare 403 to requests
 * without a User-Agent, which is what server-side `fetch` sends by default.
 * Naming the storefront honestly is enough to pass.
 */
const USER_AGENT = "dukonline-storefront/1.0 (kafel-baraka)";

/** Media paths come back either absolute (CDN) or relative to the API host. */
export function media(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("/assets/")) return url;
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return API_URL.replace(/\/api\/?$/, "") + url;
}

export class StorefrontError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StorefrontError";
  }
}

/**
 * Reads are hedged (see `hedge.ts`): a second attempt starts after 2 s and a
 * third after 5 s if nothing has answered, and the whole read gives up after
 * 15 s. Writes are sent once, so an order can't be placed twice.
 */
const READ_HEDGE = [0, 2_000, 5_000];
const READ_DEADLINE = 15_000;
const WRITE_TIMEOUT = 30_000;

const noAnswer = () => new StorefrontError("Do'kon tizimi javob bermadi", 504);

async function attempt<T>(path: string, method: "GET" | "POST", body: unknown, signal: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Storefront-Key": STOREFRONT_KEY,
        "User-Agent": USER_AGENT,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      // Caching is ours (see `cached`), not the framework's.
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) throw noAnswer();
    throw new StorefrontError("Do'kon tizimiga ulanib bo'lmadi", 504);
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}) as { error?: string });
    // A non-JSON failure (a proxy error page) still says which status it was.
    throw new StorefrontError(detail?.error || `Xatolik (${res.status})`, res.status);
  }

  return res.json() as Promise<T>;
}

async function request<T>(path: string, method: "GET" | "POST" = "GET", body?: unknown): Promise<T> {
  if (!STOREFRONT_KEY) {
    throw new StorefrontError(
      "DUKONLINE_STOREFRONT_KEY is not set. Copy it from the ERP SuperAdmin panel (organization -> Online Store) into .env.local.",
      500,
    );
  }
  if (method !== "GET") return attempt<T>(path, method, body, AbortSignal.timeout(WRITE_TIMEOUT));
  return hedge((signal) => attempt<T>(path, "GET", undefined, signal), {
    delays: READ_HEDGE,
    deadline: READ_DEADLINE,
    // A hang or a gateway failure is worth another try; a 4xx won't change.
    retryable: (error) => !(error instanceof StorefrontError) || error.status >= 500,
    timeoutError: noAnswer,
  });
}

const cache = createSwrCache();

/** Runs work after the response is sent, so no page waits on it. */
function inBackground(task: () => Promise<unknown>) {
  try {
    after(task);
  } catch {
    // Outside a request (a build step): just start it.
    void task();
  }
}

/**
 * A GET served from memory, refreshed in the background once older than
 * `freshSeconds`. Shared ones are also kept in KV for every instance of the
 * Worker, written at most every 5 minutes (KV's free plan allows 1 000
 * writes a day); personal ones (customer prices) stay in memory.
 */
function cached<T>(path: string, freshSeconds: number, share = true) {
  return cache.get<T>(path, () => request<T>(path), {
    fresh: freshSeconds * 1000,
    maxStale: 6 * 60 * 60 * 1000,
    schedule: inBackground,
    shared: share ? kvStore : undefined,
    shareEvery: 5 * 60 * 1000,
  });
}

/** Store name, display currency and the banners uploaded in the ERP. */
export function getStoreInfo() {
  return cached<StoreInfo>("/storefront/info/", 300);
}

/**
 * The entire catalog in one response: the API has no pagination, search or
 * per-product endpoint. A `customerCode` applies that customer's prices, so
 * those are cached per customer, and for less long.
 */
export function getCatalog(customerCode?: string) {
  const query = customerCode ? `?customer_code=${encodeURIComponent(customerCode)}` : "";
  return cached<CatalogResponse>(`/storefront/products/${query}`, customerCode ? 30 : 60, !customerCode);
}

/** Best sellers, as bare IDs to match against the catalog. */
export function getTopProductIds(limit = 12) {
  return cached<TopProductsResponse>(`/storefront/top-products/?limit=${limit}`, 300);
}

/** Exchanges a customer code printed in-store for the customer record. */
export function login(code: string) {
  return request<Customer>("/storefront/login/", "POST", { code });
}

/** Debt, balance and purchase history for a signed-in customer. */
export function getCustomer(code: string) {
  return request<CustomerAccountResponse>(`/storefront/customer/?code=${encodeURIComponent(code)}`);
}

export function createOrder(payload: OrderPayload) {
  return request<OrderResponse>("/storefront/orders/", "POST", payload);
}
