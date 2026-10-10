export type DeferCallback = () => void;

/**
 * Executes a function with Go‑like defer semantics.
 * The provided `defer` function registers callbacks that are guaranteed
 * to run after the main function completes, regardless of early returns
 * or thrown exceptions. Callbacks are executed in LIFO order.
 *
 * @param fn Function receiving a `defer` registration function.
 * @returns The value returned by `fn`.
 * @throws Re‑throws any exception thrown by `fn` after all defers have run.
 */
export function withDefer<T>(fn: (defer: (cb: DeferCallback) => void) => T): T {
    const stack: DeferCallback[] = [];

    const defer = (cb: DeferCallback): void => {
        if (typeof cb !== "function") {
            throw new TypeError("defer expects a function");
        }
        stack.push(cb);
    };

    let result: T;
    let caught: unknown = undefined;
    try {
        result = fn(defer);
    } catch (e) {
        caught = e;
    } finally {
        // Execute deferred callbacks in reverse order.
        while (stack.length) {
            const cb = stack.pop()!;
            try {
                cb();
            } catch (deferErr) {
                // If the main function already threw, preserve that error.
                // Otherwise, propagate the first defer error.
                if (caught === undefined) {
                    caught = deferErr;
                }
            }
        }
    }

    if (caught !== undefined) {
        throw caught;
    }
    return result!;
}

/**
 * Async variant of `withDefer`. The supplied function may return a Promise.
 * Deferred callbacks are awaited sequentially in LIFO order after the
 * primary Promise settles (fulfills or rejects).
 *
 * @param fn Async function receiving a `defer` registration function.
 * @returns Promise resolving to the value returned by `fn`.
 */
export async function withDeferAsync<T>(fn: (defer: (cb: DeferCallback) => void) => Promise<T> | T): Promise<T> {
    const stack: DeferCallback[] = [];

    const defer = (cb: DeferCallback): void => {
        if (typeof cb !== "function") {
            throw new TypeError("defer expects a function");
        }
        stack.push(cb);
    };

    let result: T;
    let caught: unknown = undefined;
    try {
        result = await fn(defer);
    } catch (e) {
        caught = e;
    } finally {
        // Run deferred callbacks sequentially; await if they return a Promise.
        while (stack.length) {
            const cb = stack.pop()!;
            try {
                const maybePromise = cb();
                if (maybePromise instanceof Promise) {
                    await maybePromise;
                }
            } catch (deferErr) {
                if (caught === undefined) {
                    caught = deferErr;
                }
            }
        }
    }

    if (caught !== undefined) {
        throw caught;
    }
    return result!;
}
