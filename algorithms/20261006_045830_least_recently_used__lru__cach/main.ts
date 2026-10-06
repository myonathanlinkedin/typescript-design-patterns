import { LRUCache } from "./engine";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// Test suite
(function runTests() {
    const cache = new LRUCache<string, number>(3);

    // Test put and get
    cache.put("a", 1);
    cache.put("b", 2);
    cache.put("c", 3);
    assert(cache.size() === 3, "Size should be 3 after 3 inserts");
    assert(cache.get("a") === 1, "Get 'a' should return 1");
    assert(cache.get("b") === 2, "Get 'b' should return 2");
    assert(cache.get("c") === 3, "Get 'c' should return 3");

    // Test LRU eviction
    cache.put("d", 4); // should evict 'a'
    assert(cache.size() === 3, "Size should remain 3 after eviction");
    assert(cache.get("a") === undefined, "'a' should have been evicted");
    assert(cache.get("d") === 4, "'d' should be present");

    // Test recency update on get
    cache.get("b"); // access 'b' to make it most recent
    cache.put("e", 5); // should evict 'c' (least recently used)
    assert(cache.get("c") === undefined, "'c' should have been evicted");
    assert(cache.get("b") === 2, "'b' should still be present");
    assert(cache.get("e") === 5, "'e' should be present");

    // Test delete
    const deleted = cache.delete("b");
    assert(deleted === true, "'b' should be deleted");
    assert(cache.get("b") === undefined, "'b' should no longer exist");
    assert(cache.size() === 2, "Size should be 2 after deletion");

    // Test updating existing key
    cache.put("d", 42);
    assert(cache.get("d") === 42, "Value of 'd' should be updated to 42");

    // Test capacity enforcement
    const smallCache = new LRUCache<number, string>(1);
    smallCache.put(1, "one");
    smallCache.put(2, "two"); // should evict 1
    assert(smallCache.get(1) === undefined, "Key 1 should be evicted");
    assert(smallCache.get(2) === "two", "Key 2 should be present");

    // Edge case: capacity zero should throw
    let errorThrown = false;
    try {
        new LRUCache<any, any>(0);
    } catch (e) {
        errorThrown = true;
    }
    assert(errorThrown, "Creating cache with capacity 0 should throw");

    console.log("All tests passed!");
})();


// Demo usage
(function demo() {
    const demoCache = new LRUCache<string, string>(2);
    demoCache.put("x", "X");
    demoCache.put("y", "Y");
    console.log(demoCache.get("x")); // X
    demoCache.put("z", "Z"); // evicts 'y'
    console.log(demoCache.get("y")); // undefined
    console.log(demoCache.get("z")); // Z
})();
