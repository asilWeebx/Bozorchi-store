/**
 * Hedged requests: start one attempt, and if it hasn't answered by the next
 * delay, start another alongside it; the first success wins and the rest are
 * aborted. The ERP hangs on a large share of requests (7 of 12 catalog calls
 * hung on 2026-10-17) while the others answer in under a second, so a
 * second try in parallel beats waiting out a timeout. Only for reads.
 */

export interface HedgeOptions {
  /** When each attempt starts, in ms from the first: `[0, 2000, 5000]`. */
  delays: number[];
  /** Give up on everything after this many ms. */
  deadline: number;
  /** Whether a failure is worth another attempt (a hang or a 5xx is; a 4xx isn't). */
  retryable: (error: unknown) => boolean;
  /** The error when the deadline passes with nothing back. */
  timeoutError: () => Error;
}

export function hedge<T>(run: (signal: AbortSignal) => Promise<T>, options: HedgeOptions): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const controllers: AbortController[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];
    let launched = 0;
    let failed = 0;
    let settled = false;
    let lastError: unknown;

    const finish = (done: () => void) => {
      if (settled) return;
      settled = true;
      timers.forEach(clearTimeout);
      controllers.forEach((c) => c.abort());
      done();
    };

    const launch = () => {
      if (settled || launched >= options.delays.length) return;
      launched++;
      const controller = new AbortController();
      controllers.push(controller);
      run(controller.signal).then(
        (value) => finish(() => resolve(value)),
        (error) => {
          if (settled) return;
          lastError = error;
          failed++;
          if (!options.retryable(error)) return finish(() => reject(error));
          // A quick failure needn't wait for the next slot.
          if (launched < options.delays.length) return launch();
          if (failed === launched) finish(() => reject(lastError));
        },
      );
    };

    options.delays.forEach((delay, index) => {
      if (index === 0) launch();
      else timers.push(setTimeout(launch, delay));
    });
    timers.push(setTimeout(() => finish(() => reject(options.timeoutError())), options.deadline));
  });
}
