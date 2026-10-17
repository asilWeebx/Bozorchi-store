import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { CacheEntry, SharedStore } from "./swr-cache";

/** The part of a Workers KV namespace this uses. */
interface Kv {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/** Bump to drop every stored entry after a change in what is stored. */
const PREFIX = "v1:";

/** A week: long enough to cover an ERP outage, short enough to go stale-proof. */
const TTL_SECONDS = 7 * 24 * 60 * 60;

/** The `STOREFRONT_CACHE` KV binding on Cloudflare; null in `next dev`, where there is none. */
function kv(): Kv | null {
  try {
    return (getCloudflareContext().env as { STOREFRONT_CACHE?: Kv }).STOREFRONT_CACHE ?? null;
  } catch {
    return null;
  }
}

/**
 * The last good ERP responses in Workers KV, so a fresh instance of the
 * Worker starts from them instead of from the ERP.
 */
export const kvStore: SharedStore = {
  async get(key) {
    const store = kv();
    if (!store) return null;
    const entry = (await store.get(PREFIX + key, "json")) as CacheEntry | null;
    return entry && typeof entry.at === "number" ? entry : null;
  },
  async put(key, entry) {
    const store = kv();
    if (!store) return;
    await store.put(PREFIX + key, JSON.stringify(entry), { expirationTtl: TTL_SECONDS });
  },
};
