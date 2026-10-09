import { LRUCache } from "./engine";
import * as assert from "assert";

/**
 * Helper to run a test case and report failures with context.
 */
function test(name: string, fn: () => void): void {
    try {
        fn();
        console.log(`✅ ${name}`);
    } catch (e) {
        console.error(`❌ ${name}`);
        console.error(e);
        process.exit(1);
    }
}

/* ---------- Unit Tests ---------- */

// Basic put/get functionality
test("Basic put and get", () => {
    const cache = new LRUCache<number, string>(2);
    cache.put(1, "one");
    cache.put(2, "two");
    assert.strictEqual(cache.get(1), "one");
    assert.strictEqual(cache.get(2), "two");
    assert.strictEqual(cache.size(), 2);
});

// Over capacity eviction order (LRU)
test("Eviction order respects LRU", () => {
    const cache = new LRUCache<number, string>(2);
    cache.put(1, "one");
    cache.put(2, "two");
    // Access key 1 to make it MRU
    assert.strictEqual(cache.get(1), "one");
    // Insert third key, should evict key 2
    cache.put(3, "three");
    assert.strictEqual(cache.get(2), undefined);
    assert.strictEqual(cache.get(1), "one");
    assert.strictEqual(cache.get(3), "three");
    assert.strictEqual(cache.size(), 2);
});

// Updating existing key moves it to MRU
test("Updating existing key refreshes recency", () => {
    const cache = new LRUCache<number, string>(2);
    cache.put(1, "one");
    cache.put(2, "two");
    cache.put(1, "ONE"); // update value and recency
    cache.put(3, "three"); // should evict key 2
    assert.strictEqual(cache.get(2), undefined);
    assert.strictEqual(cache.get(1), "ONE");
    assert.strictEqual(cache.get(3), "three");
});

// Capacity zero cache never stores anything
test("Zero capacity cache behaves correctly", () => {
    const cache = new LRUCache<string, number>(0);
    cache.put("a", 1);
    assert.strictEqual(cache.get("a"), undefined);
    assert.strictEqual(cache.size(), 0);
});

// Stress test with many operations
test("Stress test with many puts and gets", () => {
    const capacity = 5;
    const cache = new LRUCache<number, number>(capacity);
    // Fill cache
    for (let i = 0; i < capacity; i++) {
        cache.put(i, i * 10);
    }
    // Access pattern that rotates LRU
    for (let i = 0; i < 20; i++) {
        const key = i % capacity;
        assert.strictEqual(cache.get(key), key * 10);
        cache.put(capacity + i, (capacity + i) * 10);
        // After each insertion, size must stay at capacity
        assert.strictEqual(cache.size(), capacity);
    }
});

// Verify that internal order is correct via indirect checks
test("Indirect order verification", () => {
    const cache = new LRUCache<string, string>(3);
    cache.put("a", "A");
    cache.put("b", "B");
    cache.put("c", "C");
    // Access a, making order: a (MRU), c, b (LRU)
    assert.strictEqual(cache.get("a"), "A");
    // Insert d, should evict b
    cache.put("d", "D");
    assert.strictEqual(cache.get("b"), undefined);
    assert.strictEqual(cache.get("c"), "C");
    assert.strictEqual(cache.get("a"), "A");
    assert.strictEqual(cache.get("d"), "D");
});

/* ---------- Demo ---------- */
console.log("\n--- Demo ---");
const demoCache = new LRUCache<number, string>(3);
demoCache.put(1, "one");
demoCache.put(2, "two");
demoCache.put(3, "three");
console.log("Initial cache:", [demoCache.get(1), demoCache.get(2), demoCache.get(3)]); // all present
demoCache.get(2); // access 2 -> MRU
demoCache.put(4, "four"); // evicts key 1 (LRU)
console.log("After eviction:", [demoCache.get(1), demoCache.get(2), demoCache.get(3), demoCache.get(4)]); // 1 is undefined

console.log("\nAll tests passed.");
