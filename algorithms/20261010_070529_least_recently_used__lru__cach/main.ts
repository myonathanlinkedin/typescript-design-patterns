import { LRUCache } from "./core";
import * as assert from "assert";

/* ---------- Unit Tests ---------- */
function testBasicOperations(): void {
    const cache = new LRUCache<string, number>(2);
    cache.put("a", 1);
    cache.put("b", 2);
    assert.strictEqual(cache.get("a"), 1, "Get existing key a");
    cache.put("c", 3); // should evict b
    assert.strictEqual(cache.get("b"), undefined, "Key b evicted");
    assert.strictEqual(cache.get("c"), 3, "Get newly added key c");
    assert.strictEqual(cache.get("a"), 1, "Key a still present");
    cache.put("d", 4); // evict c (least recent)
    assert.strictEqual(cache.get("c"), undefined, "Key c evicted after d");
    assert.strictEqual(cache.get("d"), 4, "Key d present");
    assert.strictEqual(cache.size(), 2, "Cache size remains at capacity");
}

function testUpdateExistingKey(): void {
    const cache = new LRUCache<number, string>(3);
    cache.put(1, "one");
    cache.put(2, "two");
    cache.put(3, "three");
    cache.put(2, "TWO"); // update value and move to MRU
    assert.strictEqual(cache.get(2), "TWO", "Updated value for key 2");
    cache.put(4, "four"); // should evict key 1 (least recent)
    assert.strictEqual(cache.get(1), undefined, "Key 1 evicted after update of 2");
    assert.strictEqual(cache.get(3), "three", "Key 3 still present");
    assert.strictEqual(cache.get(4), "four", "Key 4 present");
}

function testCapacityOne(): void {
    const cache = new LRUCache<string, string>(1);
    cache.put("x", "X");
    assert.strictEqual(cache.get("x"), "X");
    cache.put("y", "Y"); // evicts x
    assert.strictEqual(cache.get("x"), undefined);
    assert.strictEqual(cache.get("y"), "Y");
}

function testInvalidCapacity(): void {
    assert.throws(() => new LRUCache<number, number>(0), /Capacity must be a positive integer/);
    assert.throws(() => new LRUCache<number, number>(-5), /Capacity must be a positive integer/);
}

/* ---------- Run Tests ---------- */
function runAllTests(): void {
    console.log("Running LRUCache unit tests...");
    testBasicOperations();
    testUpdateExistingKey();
    testCapacityOne();
    testInvalidCapacity();
    console.log("All tests passed.");
}

/* ---------- Simple Benchmark ---------- */
function benchmark(): void {
    const ops = 1_000_000;
    const cache = new LRUCache<number, number>(10_000);
    console.time("LRUCache put/get benchmark");
    for (let i = 0; i < ops; i++) {
        cache.put(i, i);
        const v = cache.get(i - 1);
        // use v to avoid dead code elimination (no effect in TS runtime)
        if (v !== undefined && v < 0) console.log(v);
    }
    console.timeEnd("LRUCache put/get benchmark");
}

/* ---------- Entry Point ---------- */
function main(): void {
    runAllTests();
    benchmark();
}

main();
