import { LRUCache } from "./engine";

/* Simple assertion helper – throws on failure. */
function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

/* ==== Unit Tests ==== */
function runTests(): void {
    // Test 1: Basic put/get.
    const cache1 = new LRUCache<number, string>(2);
    cache1.put(1, "one");
    cache1.put(2, "two");
    assert(cache1.get(1) === "one", "Test1: get(1) should return 'one'");
    assert(cache1.get(2) === "two", "Test1: get(2) should return 'two'");

    // Test 2: LRU eviction order.
    const cache2 = new LRUCache<number, string>(2);
    cache2.put(1, "one");
    cache2.put(2, "two");
    cache2.get(1); // Access 1 -> now 2 is LRU.
    cache2.put(3, "three"); // Evicts key 2.
    assert(cache2.get(2) === undefined, "Test2: key 2 should have been evicted");
    assert(cache2.get(1) === "one", "Test2: key 1 should still be present");
    assert(cache2.get(3) === "three", "Test2: key 3 should be present");

    // Test 3: Updating existing key moves it to MRU.
    const cache3 = new LRUCache<string, number>(2);
    cache3.put("a", 1);
    cache3.put("b", 2);
    cache3.put("a", 10); // Update 'a' value.
    cache3.put("c", 3); // Should evict 'b' because 'a' became MRU.
    assert(cache3.get("b") === undefined, "Test3: 'b' should be evicted");
    assert(cache3.get("a") === 10, "Test3: 'a' should have updated value 10");
    assert(cache3.get("c") === 3, "Test3: 'c' should be present");

    // Test 4: Capacity zero – cache disabled.
    const cache4 = new LRUCache<number, number>(0);
    cache4.put(1, 100);
    assert(cache4.get(1) === undefined, "Test4: cache with capacity 0 should never store values");
    assert(cache4.size() === 0, "Test4: size should be 0");

    // Test 5: Large number of operations (stress test).
    const capacity = 100;
    const cache5 = new LRUCache<number, number>(capacity);
    for (let i = 0; i < 1000; i++) {
        cache5.put(i, i * 10);
        // Randomly access some recent keys.
        if (i % 10 === 0) {
            const key = i - 5;
            if (key >= 0) {
                cache5.get(key);
            }
        }
    }
    // After 1000 puts, only the last `capacity` keys should remain.
    for (let i = 0; i < 1000 - capacity; i++) {
        assert(cache5.get(i) === undefined, `Test5: key ${i} should have been evicted`);
    }
    for (let i = 1000 - capacity; i < 1000; i++) {
        assert(cache5.get(i) === i * 10, `Test5: key ${i} should be present`);
    }
    assert(cache5.size() === capacity, "Test5: size should equal capacity");

    console.log("All LRUCache tests passed.");
}

/* ==== Demo ==== */
function demo(): void {
    const cache = new LRUCache<string, string>(3);
    console.log("Demo: inserting A, B, C");
    cache.put("A", "Alpha");
    cache.put("B", "Beta");
    cache.put("C", "Gamma");
    console.log("Cache get B:", cache.get("B")); // Access B -> B becomes MRU
    console.log("Inserting D (should evict A)");
    cache.put("D", "Delta");
    console.log("Cache get A (expected undefined):", cache.get("A"));
    console.log("Cache get C (still present):", cache.get("C"));
    console.log("Cache get D:", cache.get("D"));
}

/* Execute tests and demo. */
runTests();
demo();
