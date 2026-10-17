import assert from "node:assert/strict";
import test from "node:test";

import { hedge } from "../src/lib/storefront/hedge.ts";

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    });
  });

class HttpError extends Error {
  status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

const options = {
  delays: [0, 20, 50],
  deadline: 300,
  retryable: (e: unknown) => !(e instanceof HttpError) || e.status >= 500,
  timeoutError: () => new Error("timeout"),
};

test("a hanging first attempt is overtaken by the second, and aborted", async () => {
  const aborted: number[] = [];
  let n = 0;
  const value = await hedge(async (signal) => {
    const me = ++n;
    signal.addEventListener("abort", () => aborted.push(me));
    if (me === 1) await wait(1000, signal);
    return `answer ${me}`;
  }, options);
  assert.equal(value, "answer 2");
  assert.deepEqual(aborted, [1, 2]);
});

test("a quick 5xx starts the next attempt at once", async () => {
  let n = 0;
  const started: number[] = [];
  const t0 = Date.now();
  const value = await hedge(async () => {
    started.push(Date.now() - t0);
    if (++n === 1) throw new HttpError(504);
    return "ok";
  }, options);
  assert.equal(value, "ok");
  assert.ok(started[1] < 15, "did not wait for the 20 ms slot");
});

test("a 4xx is final", async () => {
  let n = 0;
  await assert.rejects(
    hedge(async () => {
      n++;
      throw new HttpError(404);
    }, options),
    /HTTP 404/,
  );
  assert.equal(n, 1);
});

test("when every attempt hangs, the deadline answers", async () => {
  await assert.rejects(
    hedge((signal) => wait(1000, signal).then(() => "late"), { ...options, deadline: 100 }),
    /timeout/,
  );
});
