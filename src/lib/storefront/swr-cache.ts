/**
 * Stale-while-revalidate in memory, per server process (per isolate on
 * Cloudflare), backed by an optional store every instance shares (KV). The
 * ERP usually answers in under a second but often hangs for a minute before
 * a 504, so pages never wait on it when they have something to show:
 *
 * - younger than `fresh`: served as is;
 * - older: served at once, and refreshed in the background (`schedule`);
 * - not in memory (a fresh instance): read from the shared store first;
 * - nothing anywhere, or older than `maxStale`: loaded now, and if that
 *   fails the last good copy is served anyway.
 */

export interface CacheEntry {
  value: unknown;
  /** When the ERP sent it, in ms since the epoch. */
  at: number;
}

/** A store shared by every instance; failures in it are ignored. */
export interface SharedStore {
  get(key: string): Promise<CacheEntry | null>;
  put(key: string, entry: CacheEntry): Promise<void>;
}

export interface SwrOptions {
  /** Milliseconds a value is served without asking the ERP. */
  fresh: number;
  /** Past this age a request waits for a reload instead of getting the old value first. */
  maxStale: number;
  /** Runs work after the response; the default just starts it. */
  schedule?: (task: () => Promise<unknown>) => void;
  shared?: SharedStore;
  /** The fewest milliseconds between writes of one key to the shared store (it has a daily write quota). */
  shareEvery?: number;
  now?: () => number;
}

/** Entries kept per process; personal catalogs (customer prices) are keyed per customer. */
const MAX_ENTRIES = 200;

export function createSwrCache() {
  const entries = new Map<string, CacheEntry>();
  const loading = new Map<string, Promise<unknown>>();
  /** When this process last wrote each key to the shared store. */
  const sharedAt = new Map<string, number>();

  function remember(key: string, entry: CacheEntry) {
    entries.delete(key);
    entries.set(key, entry);
    if (entries.size > MAX_ENTRIES) entries.delete(entries.keys().next().value!);
  }

  /** One load per key at a time; a success replaces the cached value. */
  function load<T>(key: string, loader: () => Promise<T>, options: SwrOptions): Promise<T> {
    const running = loading.get(key);
    if (running) return running as Promise<T>;
    const now = options.now ?? Date.now;
    const promise = loader()
      .then((value) => {
        const entry = { value, at: now() };
        remember(key, entry);
        const { shared } = options;
        if (shared && now() - (sharedAt.get(key) ?? 0) >= (options.shareEvery ?? 0)) {
          sharedAt.set(key, now());
          (options.schedule ?? ((task) => void task()))(() => shared.put(key, entry).catch(() => undefined));
        }
        return value;
      })
      .finally(() => loading.delete(key));
    loading.set(key, promise);
    return promise;
  }

  async function get<T>(key: string, loader: () => Promise<T>, options: SwrOptions): Promise<T> {
    const now = options.now ?? Date.now;
    let hit = entries.get(key);
    if (!hit && options.shared) {
      const remote = await options.shared.get(key).catch(() => null);
      if (remote) {
        hit = remote;
        remember(key, remote);
        // Another instance just wrote it; this one needn't write it back soon.
        sharedAt.set(key, remote.at);
      }
    }
    const age = hit ? now() - hit.at : Infinity;

    if (hit && age < options.fresh) return hit.value as T;
    if (hit && age < options.maxStale) {
      const refresh = () => load(key, loader, options).catch(() => undefined);
      (options.schedule ?? ((task) => void task()))(refresh);
      return hit.value as T;
    }
    try {
      return await load(key, loader, options);
    } catch (error) {
      if (hit) return hit.value as T;
      throw error;
    }
  }

  return { get, clear: () => entries.clear() };
}
