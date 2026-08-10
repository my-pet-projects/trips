/**
 * Caps how many callers hold the resource at once. A freed slot is handed
 * straight to the next waiter, so `active` never dips in the window before that
 * waiter resumes and lets an extra caller through.
 */
export function createSemaphore(limit: number) {
  let active = 0;
  const waiting: Array<() => void> = [];

  const release = () => {
    const next = waiting.shift();
    if (next) next();
    else active--;
  };

  return async function acquire(): Promise<() => void> {
    if (active < limit) active++;
    else await new Promise<void>((resolve) => waiting.push(resolve));

    let released = false;
    return () => {
      if (released) return;
      released = true;
      release();
    };
  };
}
