import { LRUCache } from "./core";
import * as assert from "assert";

/* Helper to run a test and report its name */
function runTest(name: string, fn: () => void): void {
    try {
        fn();
        console.log(`✔ ${name}`);
    } catch (e) {
        console.error(`✘ ${name}`);
        throw e;
    }
}

/* ==== Unit Tests ==== */
runTest("Basic put/get functionality", () => {
    const cache = new LRUCache<number, string>(2);
    cache.put(1, "a");
    cache.put(2, "b");
    assert.strictEqual(cache.get(1), "a");
    assert.strictEqual(cache.get(2), "b");
    assert.deepStrictEqual(cache.keys(), [2, 1]); // most recent first
});

runTest("LRU eviction order", () => {
    const cache = new LRUCache<number, string>(2);
    cache.put(1, "a");
    cache.put(2, "b");
    cache.get(1); // 1 becomes most recent
    cache.put(3, "c"); // evicts key 2
    assert.strictEqual(cache.get(2), undefined);
    assert.strictEqual(cache.get(1), "a");
    assert.strictEqual(cache.get(3), "c");
    assert.deepStrictEqual(cache.keys(), [3, 1]);
});

runTest("Update existing key moves to front", () => {
    const cache = new LRUCache<string, number>(3);
    cache.put("x", 10);
    cache.put("y", 20);
    cache.put("z", 30);
    cache.put("y", 200); // update y
    assert.strictEqual(cache.get("y"), 200);
    assert.deepStrictEqual(cache.keys(), ["y", "z", "x"]);
});

runTest("Capacity zero cache never stores", () => {
    const cache = new LRUCache<number, string>(0);
    cache.put(1, "a");
    assert.strictEqual(cache.size(), 0);
    assert.strictEqual(cache.get(1), undefined);
    assert.deepStrictEqual(cache.keys(), []);
});

runTest("Size tracking correctness", () => {
    const cache = new LRUCache<number, number>(3);
    assert.strictEqual(cache.size(), 0);
    cache.put(1, 1);
    assert.strictEqual(cache.size(), 1);
    cache.put(2, 2);
    cache.put(3, 3);
    assert.strictEqual(cache.size(), 3);
    cache.put(4, 4); // evicts 1
    assert.strictEqual(cache.size(), 3);
    assert.strictEqual(cache.get(1), undefined);
});

runTest("Stress test with many operations", () => {
    const N = 10000;
    const cache = new LRUCache<number, number>(50);
    for (let i = 0; i < N; i++) {
        cache.put(i, i * 2);
        // occasional reads
        if (i % 3 === 0) {
            const key = i - 10;
            if (key >= 0) {
                const val = cache.get(key);
                if (val !== undefined) {
                    assert.strictEqual(val, key * 2);
                }
            }
        }
    }
    assert.strictEqual(cache.size(), 50);
});

/* ==== Simple Benchmark ==== */
function benchmark(): void {
    const ops = 1_000_000;
    const cache = new LRUCache<number, number>(1000);
    console.time("LRUCache benchmark");
    for (let i = 0; i < ops; i++) {
        cache.put(i, i);
        cache.get(i - 1);
    }
    console.timeEnd("LRUCache benchmark");
}
benchmark();

console.log("All tests passed.");
