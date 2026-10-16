import { LRUCache } from "./core";
import * as assert from "assert";

/* ---------- Unit Tests ---------- */
function testBasicOperations(): void {
    const cache = new LRUCache<number, string>(2);
    cache.put(1, "one");
    cache.put(2, "two");
    assert.strictEqual(cache.get(1), "one", "Get existing key 1");
    // This put should evict key 2 (least recently used)
    cache.put(3, "three");
    assert.strictEqual(cache.get(2), undefined, "Key 2 should be evicted");
    assert.strictEqual(cache.get(3), "three", "Key 3 present");
    assert.strictEqual(cache.get(1), "one", "Key 1 still present");
    // Updating existing key moves it to front
    cache.put(1, "ONE");
    assert.strictEqual(cache.get(1), "ONE", "Updated value for key 1");
    // Adding another should evict key 3
    cache.put(4, "four");
    assert.strictEqual(cache.get(3), undefined, "Key 3 evicted after recent use of 1");
    assert.strictEqual(cache.get(4), "four", "Key 4 present");
}

function testCapacityZero(): void {
    const cache = new LRUCache<string, number>(0);
    cache.put("a", 1);
    assert.strictEqual(cache.size(), 0, "Cache size remains zero");
    assert.strictEqual(cache.get("a"), undefined, "No entry stored");
}

function testDelete(): void {
    const cache = new LRUCache<string, boolean>(3);
    cache.put("x", true);
    cache.put("y", false);
    assert.strictEqual(cache.delete("x"), true, "Delete existing key");
    assert.strictEqual(cache.get("x"), undefined, "Deleted key not retrievable");
    assert.strictEqual(cache.delete("z"), false, "Delete non‑existent key returns false");
    assert.strictEqual(cache.size(), 1, "Size reflects deletion");
}

function testOverwriteKeepsRecency(): void {
    const cache = new LRUCache<number, number>(2);
    cache.put(1, 10);
    cache.put(2, 20);
    // Overwrite key 1, should become most recent
    cache.put(1, 15);
    cache.put(3, 30); // should evict key 2
    assert.strictEqual(cache.get(2), undefined, "Key 2 evicted after overwrite of 1");
    assert.strictEqual(cache.get(1), 15, "Key 1 retained with new value");
    assert.strictEqual(cache.get(3), 30, "Key 3 present");
}

/* ---------- Run Tests ---------- */
function runAll(): void {
    testBasicOperations();
    testCapacityZero();
    testDelete();
    testOverwriteKeepsRecency();
    console.log("All LRUCache tests passed.");
}

runAll();

/* ---------- Simple Benchmark (optional) ---------- */
function benchmark(iterations: number = 1_000_000): void {
    const cache = new LRUCache<number, number>(1000);
    console.time("LRUCache benchmark");
    for (let i = 0; i < iterations; i++) {
        const key = i % 1500; // some keys exceed capacity to trigger evictions
        cache.put(key, i);
        cache.get(key);
    }
    console.timeEnd("LRUCache benchmark");
}

// Uncomment to run a quick benchmark
// benchmark();
