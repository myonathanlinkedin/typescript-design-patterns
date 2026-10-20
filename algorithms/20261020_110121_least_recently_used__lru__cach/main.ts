import { LRUCache } from "./engine";

/**
 * Simple assertion utility.
 */
function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

/**
 * Unit tests for LRUCache.
 */
function runTests(): void {
    // Test 1: Basic put and get
    const cache1 = new LRUCache<number, string>(2);
    cache1.put(1, "one");
    cache1.put(2, "two");
    assert(cache1.get(1) === "one", "Test1: get(1) should return 'one'");
    assert(cache1.get(2) === "two", "Test1: get(2) should return 'two'");
    assert(cache1.size() === 2, "Test1: size should be 2");

    // Test 2: Eviction order
    const cache2 = new LRUCache<string, number>(3);
    cache2.put("a", 1);
    cache2.put("b", 2);
    cache2.put("c", 3);
    // Access 'a' to make it most-recent
    assert(cache2.get("a") === 1, "Test2: get('a') should be 1");
    // Insert new entry, should evict least-recent ('b')
    cache2.put("d", 4);
    assert(cache2.get("b") === undefined, "Test2: 'b' should have been evicted");
    assert(cache2.get("c") === 3, "Test2: 'c' should still be present");
    assert(cache2.get("d") === 4, "Test2: 'd' should be present");
    assert(cache2.size() === 3, "Test2: size should remain at capacity 3");

    // Test 3: Updating existing key moves it to head
    const cache3 = new LRUCache<number, number>(2);
    cache3.put(1, 10);
    cache3.put(2, 20);
    // Update key 1
    cache3.put(1, 15);
    // Insert new key, should evict key 2 (least recent)
    cache3.put(3, 30);
    assert(cache3.get(2) === undefined, "Test3: key 2 should be evicted after update of key 1");
    assert(cache3.get(1) === 15, "Test3: key 1 should have updated value 15");
    assert(cache3.get(3) === 30, "Test3: key 3 should be present");

    // Test 4: Capacity of 1
    const cache4 = new LRUCache<string, string>(1);
    cache4.put("x", "X");
    assert(cache4.get("x") === "X", "Test4: get('x') should be 'X'");
    cache4.put("y", "Y");
    assert(cache4.get("x") === undefined, "Test4: 'x' should be evicted");
    assert(cache4.get("y") === "Y", "Test4: 'y' should be present");
    assert(cache4.size() === 1, "Test4: size should be 1");

    // Test 5: Get missing key returns undefined
    const cache5 = new LRUCache<number, boolean>(2);
    assert(cache5.get(999) === undefined, "Test5: missing key should return undefined");

    // Test 6: Invalid capacity throws
    let threw = false;
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const badCache = new LRUCache<number, number>(0);
    } catch (e) {
        threw = true;
    }
    assert(threw, "Test6: constructing with capacity 0 should throw");

    console.log("All tests passed.");
}

/**
 * Demonstration of LRUCache usage.
 */
function demo(): void {
    const cache = new LRUCache<string, number>(3);
    console.log("Demo: inserting a, b, c");
    cache.put("a", 1);
    cache.put("b", 2);
    cache.put("c", 3);
    console.log("Cache state after inserts (size):", cache.size());

    console.log("Accessing 'b' (should become most-recent)");
    console.log("get('b') =", cache.get("b"));

    console.log("Inserting 'd' (should evict least-recent 'a')");
    cache.put("d", 4);
    console.log("get('a') =", cache.get("a")); // undefined
    console.log("get('c') =", cache.get("c")); // 3
    console.log("get('d') =", cache.get("d")); // 4
}

// Execute tests and demo
runTests();
demo();
