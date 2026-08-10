import { describe, expect, it } from "vitest";

import { createSemaphore } from "~/server/routing/semaphore";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

describe("createSemaphore", () => {
  it("never runs more than the limit at once", async () => {
    const acquire = createSemaphore(2);
    let active = 0;
    let peak = 0;
    const gate = deferred();

    const tasks = Array.from({ length: 6 }, async () => {
      const release = await acquire();
      active++;
      peak = Math.max(peak, active);
      await gate.promise;
      active--;
      release();
    });

    await Promise.resolve();
    gate.resolve();
    await Promise.all(tasks);

    expect(peak).toBe(2);
    expect(active).toBe(0);
  });

  it("hands a freed slot to the next waiter", async () => {
    const acquire = createSemaphore(1);
    const order: number[] = [];

    const first = await acquire();
    const second = acquire().then((release) => {
      order.push(2);
      release();
    });

    order.push(1);
    first();
    await second;

    expect(order).toEqual([1, 2]);
  });

  it("ignores a repeated release so the limit still holds", async () => {
    const acquire = createSemaphore(1);
    const release = await acquire();

    release();
    release();

    let secondHeld = false;
    void acquire().then(() => (secondHeld = true));
    await Promise.resolve();
    expect(secondHeld).toBe(true);

    let thirdHeld = false;
    void acquire().then(() => (thirdHeld = true));
    await Promise.resolve();
    expect(thirdHeld).toBe(false);
  });
});
