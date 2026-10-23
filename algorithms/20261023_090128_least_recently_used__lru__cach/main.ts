import { LRUCache } from "./core";
import * as assert from "assert";

/* ---------- Unit Tests ---------- */
function testBasicOperations(): void {
    const cache = new LRUCache<number, string>(2);
    assert.strictEqual(cache.size(), 0);

    cache.put(1, "one");
    assert.strictEqual(cache.get(1), "one");
    assert.strictEqual(cache.size(), 1);

    cache.put(2, "two");
    assert.strictEqual(cache.get(2), "two");
    assert.strictEqual(cache.size(), 2);

    // Cache is full; next insertion should evict key 1 (least recently used)
    cache.put(3, "three");
    assert.strictEqual(cache.get(1), undefined);
    assert.strictEqual(cache.get(2), "two");
    assert.strictEqual(cache.get(3), "three");
    assert.strictEqual(cache.size(), 2);
}

function testRecencyUpdate(): void {
    const cache = new LRUCache<string, number>(3);
    cache.put("a", 1);
    cache.put("b", 2);
    cache.put("c", 3);
    // Access 'a' makes it most recent
    assert.strictEqual(cache.get("a"), 1);
    // Insert new entry, should evict 'b' (least recent)
    cache.put("d", 4);
    assert.strictEqual(cache.get("b"), undefined);
    assert.strictEqual(cache.get("c"), 3);
    assert.strictEqual(cache.get("a"), 1);
    assert.strictEqual(cache.get("d"), 4);
}

function testOverwriteExisting(): void {
    const cache = new LRUCache<number, number>(2);
    cache.put(1, 10);
    cache.put(2, 20);
    cache.put(1, 15); // overwrite and move to front
    assert.strictEqual(cache.get(1), 15);
    // Adding a new key should evict key 2
    cache.put(3, 30);
    assert.strictEqual(cache.get(2), undefined);
    assert.strictEqual(cache.get(3), 30);
    assert.strictEqual(cache.get(1), 15);
}

function testZeroCapacity(): void {
    const cache = new LRUCache<string, string>(0);
    cache.put("x", "X");
    assert.strictEqual(cache.get("x"), undefined);
    assert.strictEqual(cache.size(), 0);
    cache.put("y", "Y");
    assert.strictEqual(cache.get("y"), undefined);
    assert.strictEqual(cache.size(), 0);
}

function testClear(): void {
    const cache = new LRUCache<number, string>(3);
    cache.put(1, "a");
    cache.put(2, "b");
    cache.clear();
    assert.strictEqual(cache.size(), 0);
    assert.strictEqual(cache.get(1), undefined);
    assert.strictEqual(cache.get(2), undefined);
}

/* ---------- Run Tests ---------- */
function runAllTests(): void {
    testBasicOperations();
    testRecencyUpdate();
    testOverwriteExisting();
    testZeroCapacity();
    testClear();
    console.log("All unit tests passed.");
}

/* ---------- Simple Benchmark ---------- */
function benchmark(): void {
    const N = 200_000;
    const cache = new LRUCache<number, number>(N / 2);
    console.time("benchmark-put");
    for (let i = 0; i < N; i++) {
        cache.put(i, i);
    }
    console.timeEnd("benchmark-put");

    console.time("benchmark-get");
    for (let i = 0; i < N; i++) {
        cache.get(i);
    }
    console.timeEnd("benchmark-get");
}

/* ---------- Entry Point ---------- */
function main(): void {
    runAllTests();
    benchmark();
}

main();
