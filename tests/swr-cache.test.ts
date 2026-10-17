import assert from "node:assert/strict";
import test from "node:test";

import { createSwrCache } from "../src/lib/storefront/swr-cache.ts";

function clock(start = 0) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

test("a fresh value is served without asking the ERP again", async () => {
  const cache = createSwrCache();
  const time = clock();
  let calls = 0;
  const loader = async () => ++calls;
  const options = { fresh: 1000, maxStale: 10_000, now: time.now };
  assert.equal(await cache.get("k", loader, options), 1);
  time.advance(500);
  assert.equal(await cache.get("k", loader, options), 1);
  assert.equal(calls, 1);
});

test("a stale value is served at once while a refresh runs in the background", async () => {
  const cache = createSwrCache();
  const time = clock();
  let calls = 0;
  const scheduled: (() => Promise<unknown>)[] = [];
  const options = { fresh: 1000, maxStale: 10_000, now: time.now, schedule: (task: () => Promise<unknown>) => void scheduled.push(task) };
  await cache.get("k", async () => ++calls, options);
  time.advance(2000);
  assert.equal(await cache.get("k", async () => ++calls, options), 1, "the old value, without waiting");
  assert.equal(scheduled.length, 1);
  await scheduled[0]();
  assert.equal(await cache.get("k", async () => ++calls, options), 2, "the refreshed value next time");
});

test("when the ERP fails, the last good value is served", async () => {
  const cache = createSwrCache();
  const time = clock();
  const options = { fresh: 1000, maxStale: 5000, now: time.now };
  await cache.get("k", async () => "good", options);
  time.advance(60_000);
  assert.equal(await cache.get("k", async () => Promise.reject(new Error("504")), options), "good");
  await assert.rejects(cache.get("other", async () => Promise.reject(new Error("504")), options), /504/, "nothing to fall back on");
});

test("concurrent requests share one load", async () => {
  const cache = createSwrCache();
  let calls = 0;
  const loader = () => new Promise<number>((resolve) => setTimeout(() => resolve(++calls), 5));
  const options = { fresh: 1000, maxStale: 10_000 };
  const [a, b] = await Promise.all([cache.get("k", loader, options), cache.get("k", loader, options)]);
  assert.equal(a, 1);
  assert.equal(b, 1);
  assert.equal(calls, 1);
});

test("a fresh instance starts from the shared store instead of the ERP", async () => {
  const store = new Map<string, { value: unknown; at: number }>([["k", { value: "from kv", at: 1000 }]]);
  const shared = { get: async (k: string) => store.get(k) ?? null, put: async (k: string, e: { value: unknown; at: number }) => void store.set(k, e) };
  const time = clock(1500);
  let calls = 0;
  const scheduled: (() => Promise<unknown>)[] = [];
  const options = { fresh: 1000, maxStale: 10_000, now: time.now, shared, shareEvery: 5000, schedule: (t: () => Promise<unknown>) => void scheduled.push(t) };
  const cache = createSwrCache();
  assert.equal(await cache.get("k", async () => `erp ${++calls}`, options), "from kv");
  assert.equal(calls, 0);
  time.advance(1000); // now stale: served, refreshed in the background
  assert.equal(await cache.get("k", async () => `erp ${++calls}`, options), "from kv");
  await scheduled.shift()!();
  assert.equal(calls, 1);
  assert.equal(store.get("k")?.value, "from kv", "written back no sooner than shareEvery after the KV copy");
  time.advance(5000);
  await scheduled.shift()?.();
  assert.equal(await cache.get("k", async () => `erp ${++calls}`, options), "erp 1");
  // The refresh queues the KV write; run work until none is left.
  while (scheduled.length) await scheduled.shift()!();
  assert.equal(store.get("k")?.value, "erp 2", "a later refresh is shared");
});
