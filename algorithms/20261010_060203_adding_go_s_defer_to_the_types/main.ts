import { withDefer, withDeferAsync } from "./core";

function assert(condition: unknown, message: string): void {
    if (!condition) {
        throw new Error("Assertion failed: " + message);
    }
}

// Test 1: Basic LIFO ordering.
(function testBasicLIFO() {
    const order: number[] = [];
    const result = withDefer<number>((defer) => {
        defer(() => order.push(1));
        defer(() => order.push(2));
        defer(() => order.push(3));
        return 42;
    });
    assert(result === 42, "Result should be 42");
    assert(order.length === 3, "Three defer callbacks should have run");
    assert(order[0] === 3 && order[1] === 2 && order[2] === 1, "Defers must run LIFO");
})();

// Test 2: Early return still triggers defers.
(function testEarlyReturn() {
    const called = { a: false, b: false };
    const result = withDefer<string>((defer) => {
        defer(() => (called.a = true));
        if (true) {
            return "early";
        }
        defer(() => (called.b = true));
    });
    assert(result === "early", "Should return early");
    assert(called.a, "First defer should have run");
    assert(!called.b, "Second defer never registered");
})();

// Test 3: Exception propagation after defers.
(function testExceptionPropagation() {
    const log: string[] = [];
    try {
        withDefer<void>((defer) => {
            defer(() => log.push("first"));
            defer(() => log.push("second"));
            throw new Error("boom");
        });
        assert(false, "Should not reach here");
    } catch (e) {
        assert((e as Error).message === "boom", "Original error must propagate");
        assert(log.length === 2, "Both defers must run");
        assert(log[0] === "second" && log[1] === "first", "Defers run LIFO");
    }
})();

// Test 4: Defer error handling (defer throws, main succeeds).
(function testDeferError() {
    try {
        withDefer<void>((defer) => {
            defer(() => { throw new Error("defer error"); });
        });
        assert(false, "Defer error should propagate");
    } catch (e) {
        assert((e as Error).message === "defer error", "Defer error must be thrown");
    }
})();

// Test 5: Nested withDefer calls.
(function testNested() {
    const seq: string[] = [];
    const outer = withDefer<void>((deferOuter) => {
        deferOuter(() => seq.push("outer1"));
        const inner = withDefer<void>((deferInner) => {
            deferInner(() => seq.push("inner1"));
            deferInner(() => seq.push("inner2"));
        });
        deferOuter(() => seq.push("outer2"));
    });
    assert(seq.join(",") === "inner2,inner1,outer2,outer1", "Nested defers must respect LIFO per scope");
})();

// Test 6: Async variant with Promise-returning defers.
(async function testAsync() {
    const order: string[] = [];
    const result = await withDeferAsync<number>(async (defer) => {
        defer(() => order.push("first"));
        defer(async () => {
            await new Promise((res) => setTimeout(res, 10));
            order.push("second");
        });
        defer(() => order.push("third"));
        return 7;
    });
    assert(result === 7, "Async result should be 7");
    assert(order.join(",") === "third,second,first", "Async defers run LIFO, awaiting promises");
})().catch((e) => {
    console.error("Async test failed:", e);
    process.exit(1);
});

// Test 7: Async function throws, defers still run.
(async function testAsyncException() {
    const log: string[] = [];
    try {
        await withDeferAsync<void>(async (defer) => {
            defer(() => log.push("defer1"));
            defer(async () => {
                await new Promise((res) => setTimeout(res, 5));
                log.push("defer2");
            });
            throw new Error("async boom");
        });
        assert(false, "Should have thrown");
    } catch (e) {
        assert((e as Error).message === "async boom", "Original async error propagates");
        assert(log.join(",") === "defer2,defer1", "Defers run LIFO even on async error");
    }
})().catch((e) => {
    console.error("Async exception test failed:", e);
    process.exit(1);
});

console.log("All tests passed.");
